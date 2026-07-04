using IFRS.Data;
using IFRS.Notifications.DTOs;
using IFRS.Notifications.Interfaces;
using IFRS.models;
using Microsoft.EntityFrameworkCore;

namespace IFRS.Notifications.BackgroundJobs;

/// <summary>
/// Shared helpers for daily notification scans.
/// </summary>
public abstract class NotificationJobBase
{
    protected readonly IFRSDbContext DbContext;
    protected readonly INotificationService NotificationService;
    protected readonly ILogger Logger;

    protected NotificationJobBase(IFRSDbContext dbContext, INotificationService notificationService, ILogger logger)
    {
        DbContext = dbContext;
        NotificationService = notificationService;
        Logger = logger;
    }

    protected async Task<IReadOnlyList<int>> GetAdminUserIdsAsync(CancellationToken cancellationToken = default)
    {
        return await DbContext.Users
            .Where(user => user.Role == UserRole.admin)
            .Select(user => user.UserId)
            .ToListAsync(cancellationToken);
    }

    protected async Task NotifyAdminsAsync(CreateNotificationDto request, CancellationToken cancellationToken = default)
    {
        var adminIds = await GetAdminUserIdsAsync(cancellationToken);
        if (adminIds.Count == 0)
        {
            Logger.LogWarning("No admin users available to receive notification {Type}.", request.Type);
            return;
        }

        await NotificationService.CreateNotificationsForUsersAsync(adminIds, request, cancellationToken);
    }

    protected static bool IsWithinWindow(DateOnly targetDate, int days)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return targetDate >= today && targetDate <= today.AddDays(days);
    }
}
