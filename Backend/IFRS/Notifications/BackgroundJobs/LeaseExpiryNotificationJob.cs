using IFRS.Data;
using IFRS.Notifications.DTOs;
using IFRS.Notifications.Interfaces;
using IFRS.models;
using Microsoft.EntityFrameworkCore;

namespace IFRS.Notifications.BackgroundJobs;

/// <summary>
/// Generates lease expiry warnings for administrators.
/// </summary>
public sealed class LeaseExpiryNotificationJob : NotificationJobBase
{
    public LeaseExpiryNotificationJob(IFRSDbContext dbContext, INotificationService notificationService, ILogger<LeaseExpiryNotificationJob> logger)
        : base(dbContext, notificationService, logger)
    {
    }

    public async Task ExecuteAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var leases = await DbContext.Leases
            .Include(lease => lease.Branch)
            .Where(lease => lease.EndDate != null && lease.LeaseStatus == "Active")
            .ToListAsync();

        foreach (var lease in leases)
        {
            if (lease.EndDate == null)
                continue;

            var daysUntilExpiry = lease.EndDate.Value.DayNumber - today.DayNumber;
            if (daysUntilExpiry > 365)
                continue;

            var title = daysUntilExpiry <= 0 ? "Lease expired" : "Lease expiry alert";
            var message = daysUntilExpiry <= 0
                ? $"Lease {lease.LeaseNo ?? lease.LeaseId.ToString()} expired on {lease.EndDate:yyyy-MM-dd}."
                : $"Lease {lease.LeaseNo ?? lease.LeaseId.ToString()} expires in {daysUntilExpiry} day(s).";

            await NotifyAdminsAsync(new CreateNotificationDto
            {
                Title = title,
                Message = message,
                Type = NotificationType.LeaseExpiryAlert,
                ReferenceId = lease.LeaseId.ToString(),
                ReferenceType = nameof(Lease)
            });
        }

        Logger.LogInformation("Lease expiry scan completed with {Count} leases checked.", leases.Count);
    }
}
