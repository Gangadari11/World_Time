using IFRS.Data;
using IFRS.Notifications.Interfaces;
using IFRS.models;
using Microsoft.EntityFrameworkCore;

namespace IFRS.Notifications.Repositories;

/// <summary>
/// EF Core-backed notification persistence.
/// </summary>
public sealed class NotificationRepository : INotificationRepository
{
    private readonly IFRSDbContext _dbContext;

    public NotificationRepository(IFRSDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Notification?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return _dbContext.Set<Notification>().FirstOrDefaultAsync(notification => notification.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Notification>> GetPagedAsync(int userId, int skip, int take, bool? isRead, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Set<Notification>()
            .AsNoTracking()
            .Where(notification => notification.UserId == userId);

        if (isRead.HasValue)
        {
            query = query.Where(notification => notification.IsRead == isRead.Value);
        }

        return await query
            .OrderByDescending(notification => notification.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public Task<int> CountAsync(int userId, bool? isRead, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Set<Notification>().Where(notification => notification.UserId == userId);

        if (isRead.HasValue)
        {
            query = query.Where(notification => notification.IsRead == isRead.Value);
        }

        return query.CountAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Notification>> GetUnreadAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<Notification>()
            .AsNoTracking()
            .Where(notification => notification.UserId == userId && !notification.IsRead)
            .OrderByDescending(notification => notification.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> ExistsRecentAsync(int userId, NotificationType type, string? referenceId, string? referenceType, DateTime sinceUtc, CancellationToken cancellationToken = default)
    {
        return _dbContext.Set<Notification>().AnyAsync(notification =>
            notification.UserId == userId &&
            notification.Type == type &&
            notification.ReferenceId == referenceId &&
            notification.ReferenceType == referenceType &&
            notification.CreatedAt >= sinceUtc,
            cancellationToken);
    }

    public async Task AddAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        await _dbContext.Set<Notification>().AddAsync(notification, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        _dbContext.Set<Notification>().Remove(notification);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default)
    {
        var notifications = await _dbContext.Set<Notification>()
            .Where(notification => notification.UserId == userId && !notification.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
