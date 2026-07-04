using IFRS.models;



namespace IFRS.Notifications.Interfaces;

/// <summary>
/// Provides persistence operations for notifications.
/// </summary>
public interface INotificationRepository
{
    Task<Notification?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Notification>> GetPagedAsync(
        int userId,
        int skip,
        int take,
        bool? isRead,
        CancellationToken cancellationToken = default);

    Task<int> CountAsync(int userId, bool? isRead, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Notification>> GetUnreadAsync(int userId, CancellationToken cancellationToken = default);

    Task<bool> ExistsRecentAsync(
        int userId,
        NotificationType type,
        string? referenceId,
        string? referenceType,
        DateTime sinceUtc,
        CancellationToken cancellationToken = default);

    Task AddAsync(Notification notification, CancellationToken cancellationToken = default);

    Task DeleteAsync(Notification notification, CancellationToken cancellationToken = default);

    Task<int> MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default);
}
