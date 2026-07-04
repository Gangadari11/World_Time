using IFRS.Notifications.DTOs;

namespace IFRS.Notifications.Interfaces;

/// <summary>
/// Application service for creating and managing notifications.
/// </summary>
public interface INotificationService
{
    Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<NotificationDto>> CreateNotificationsForUsersAsync(
        IEnumerable<int> userIds,
        CreateNotificationDto request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<NotificationDto>> CreateForUserAndAdminsAsync(
        int userId,
        CreateNotificationDto request,
        CancellationToken cancellationToken = default);

    Task<PagedResult<NotificationDto>> GetUserNotificationsAsync(
        int userId,
        NotificationQueryParameters query,
        CancellationToken cancellationToken = default);

    Task<PagedResult<NotificationDto>> GetUnreadNotificationsAsync(
        int userId,
        NotificationQueryParameters query,
        CancellationToken cancellationToken = default);

    Task<NotificationDto?> MarkAsReadAsync(int notificationId, int userId, CancellationToken cancellationToken = default);

    Task<int> MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default);

    Task DeleteAsync(int notificationId, int userId, CancellationToken cancellationToken = default);

    Task SendRealTimeNotificationAsync(NotificationDto notification, CancellationToken cancellationToken = default);
}
