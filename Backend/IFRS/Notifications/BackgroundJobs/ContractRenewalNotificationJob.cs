using IFRS.Data;
using IFRS.Notifications.DTOs;
using IFRS.Notifications.Interfaces;
using IFRS.models;
using Microsoft.EntityFrameworkCore;

namespace IFRS.Notifications.BackgroundJobs;

/// <summary>
/// Generates contract renewal reminders ahead of lease expiry.
/// </summary>
public sealed class ContractRenewalNotificationJob : NotificationJobBase
{
    public ContractRenewalNotificationJob(IFRSDbContext dbContext, INotificationService notificationService, ILogger<ContractRenewalNotificationJob> logger)
        : base(dbContext, notificationService, logger)
    {
    }

    public async Task ExecuteAsync()
    {
        var leases = await DbContext.Leases
            .Where(lease => lease.EndDate != null && lease.LeaseStatus == "Active")
            .ToListAsync();

        foreach (var lease in leases)
        {
            if (lease.EndDate == null)
                continue;

            var daysUntilExpiry = lease.EndDate.Value.DayNumber - DateOnly.FromDateTime(DateTime.UtcNow).DayNumber;
            var renewalWindow = lease.NoticePeriodMonths.HasValue && lease.NoticePeriodMonths > 0
                ? lease.NoticePeriodMonths.Value * 30
                : 90;

            if (daysUntilExpiry > renewalWindow)
                continue;

            await NotifyAdminsAsync(new CreateNotificationDto
            {
                Title = "Contract renewal reminder",
                Message = $"Lease {lease.LeaseNo ?? lease.LeaseId.ToString()} renews in {Math.Max(daysUntilExpiry, 0)} day(s).",
                Type = NotificationType.ContractRenewalReminder,
                ReferenceId = lease.LeaseId.ToString(),
                ReferenceType = nameof(Lease)
            });
        }

        Logger.LogInformation("Contract renewal scan completed with {Count} leases checked.", leases.Count);
    }
}
