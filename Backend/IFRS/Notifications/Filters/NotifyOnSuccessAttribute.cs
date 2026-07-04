using IFRS.Data;
using IFRS.models;
using IFRS.Notifications.DTOs;
using IFRS.Notifications.Interfaces;
using IFRS.Notifications.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc.Filters;
using IFRS.services;

namespace IFRS.Notifications.Filters;

[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
public class NotifyOnSuccessAttribute : ActionFilterAttribute
{
    public string Title { get; set; } = "";
    public string MessageTemplate { get; set; } = "";
    public string ReferenceType { get; set; } = "";
    public NotificationScenario Scenario { get; set; } = NotificationScenario.DirectCreate;


    // MessageTemplate placeholders:
    // {entityName}   → branch name / lessor name / lease no from response
    // {userName}     → full name of current user
    // {userRole}     → role of current user
    // {action}       → "approved" or "rejected" (ReviewOutcome only)
    public NotifyOnSuccessAttribute(
        string title,
        string messageTemplate,
        string referenceType,
        NotificationScenario scenario = NotificationScenario.DirectCreate)
    {
        Title = title;
        MessageTemplate = messageTemplate;
        ReferenceType = referenceType;
        Scenario = scenario;
    }

    public override async Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
    {
        var executed = await next();

        if (executed.Result is not ObjectResult result) return;
        if (result.StatusCode is null or < 200 or >= 300) return;

        var services = context.HttpContext.RequestServices;
        var notificationService = services.GetRequiredService<INotificationService>();
        var dbContext = services.GetRequiredService<IFRSDbContext>();

        var currentUserId = context.HttpContext.User.GetCurrentUserId();
        if (!currentUserId.HasValue) return;

        var currentUser = await dbContext.Users.FindAsync(currentUserId.Value);
        if (currentUser == null) return;

        var entityName = ResolveEntityName(result.Value) ?? "record";
        var referenceId = ResolveReferenceId(result.Value);
        var action = ResolveReviewAction(result.Value);

        var message = MessageTemplate
            .Replace("{entityName}", entityName)
            .Replace("{userName}", currentUser.FullName ?? "Unknown")
            .Replace("{userRole}", currentUser.Role.ToString())
            .Replace("{action}", action ?? "reviewed");

        switch (Scenario)
        {
            case NotificationScenario.DirectCreate:
                // Admin creates directly → notify creator + admins (deduped by CreateForUserAndAdminsAsync)
                await notificationService.CreateForUserAndAdminsAsync(currentUserId.Value, new CreateNotificationDto
                {
                    Title = Title,
                    Message = message,
                    Type = NotificationType.UserActivityAlert,
                    ReferenceId = referenceId,
                    ReferenceType = ReferenceType
                });
                break;

            case NotificationScenario.SubmitForApproval:
                // data_entry submits → 1) confirm to requester, 2) alert admins to review
                await notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    UserId = currentUserId.Value,
                    Title = Title,
                    Message = $"Your {entityName} request was submitted and is pending admin approval.",
                    Type = NotificationType.UserActivityAlert,
                    ReferenceId = referenceId,
                    ReferenceType = ReferenceType
                });

                var adminIds = await dbContext.Users
                    .Where(u => u.Role == UserRole.admin)
                    .Select(u => u.UserId)
                    .ToListAsync();

                if (adminIds.Count > 0)
                {
                    await notificationService.CreateNotificationsForUsersAsync(adminIds, new CreateNotificationDto
                    {
                        Title = "Approval required",
                        Message = $"{currentUser.FullName} ({currentUser.Role}) submitted a {entityName} request. Please review and approve.",
                        Type = NotificationType.UserActivityAlert,
                        ReferenceId = referenceId,
                        ReferenceType = ReferenceType
                    });
                }
                break;

            case NotificationScenario.ReviewOutcome:
                // Admin reviews → notify original requester of outcome
                var originalRequesterId = ResolveRequestedBy(result.Value);
                if (originalRequesterId.HasValue)
                {
                    await notificationService.CreateNotificationAsync(new CreateNotificationDto
                    {
                        UserId = originalRequesterId.Value,
                        Title = Title,
                        Message = message
                            .Replace("{reviewerName}", currentUser.FullName ?? "An admin"),
                        Type = NotificationType.UserActivityAlert,
                        ReferenceId = referenceId,
                        ReferenceType = ReferenceType
                    });
                }
                break;
        }
    }

    // Resolve entity name from response body
    private static string? ResolveEntityName(object? value)
    {
        if (value == null) return null;
        var type = value.GetType();

        foreach (var propName in new[] { "BranchName", "FullName", "LeaseNo", "Name" })
        {
            var prop = type.GetProperty(propName);
            if (prop != null) return prop.GetValue(value)?.ToString();
        }

        // Dig into nested "data" property (WorkflowResult DTOs)
        var dataProp = type.GetProperty("data") ?? type.GetProperty("Data");
        if (dataProp != null) return ResolveEntityName(dataProp.GetValue(value));

        return null;
    }

    // Resolve referenceId from response body
    private static string? ResolveReferenceId(object? value)
    {
        if (value == null) return null;
        var type = value.GetType();

        foreach (var propName in new[] { "EntityChangeRequestId", "BranchId", "LessorId", "LeaseId", "Id" })
        {
            var prop = type.GetProperty(propName);
            if (prop != null) return prop.GetValue(value)?.ToString();
        }

        var dataProp = type.GetProperty("data") ?? type.GetProperty("Data");
        if (dataProp != null) return ResolveReferenceId(dataProp.GetValue(value));

        return null;
    }

    // Resolve original requester userId from EntityChangeRequestDto (ReviewOutcome)
    private static int? ResolveRequestedBy(object? value)
    {
        if (value == null) return null;
        var type = value.GetType();

        var prop = type.GetProperty("RequestedBy");
        if (prop != null && int.TryParse(prop.GetValue(value)?.ToString(), out var id))
            return id;

        var dataProp = type.GetProperty("data") ?? type.GetProperty("Data");
        if (dataProp != null) return ResolveRequestedBy(dataProp.GetValue(value));

        return null;
    }

    // Resolve "approved" or "rejected" from Status field (ReviewOutcome)
    private static string? ResolveReviewAction(object? value)
    {
        if (value == null) return null;
        var type = value.GetType();

        var prop = type.GetProperty("Status");
        if (prop != null)
        {
            var status = prop.GetValue(value)?.ToString()?.ToLowerInvariant();
            if (status is "approved" or "rejected") return status;
        }

        var dataProp = type.GetProperty("data") ?? type.GetProperty("Data");
        if (dataProp != null) return ResolveReviewAction(dataProp.GetValue(value));

        return null;
    }
}