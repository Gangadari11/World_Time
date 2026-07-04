
using IFRS.Notifications.DTOs;
using IFRS.Notifications.Interfaces;

public class FakeNotificationService : INotificationService
{
    // Implement required methods with empty bodies
    Task<IReadOnlyList<NotificationDto>> INotificationService.CreateForUserAndAdminsAsync(int userId, CreateNotificationDto request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    Task<NotificationDto> INotificationService.CreateNotificationAsync(CreateNotificationDto request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    Task<IReadOnlyList<NotificationDto>> INotificationService.CreateNotificationsForUsersAsync(IEnumerable<int> userIds, CreateNotificationDto request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    Task INotificationService.DeleteAsync(int notificationId, int userId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    Task<PagedResult<NotificationDto>> INotificationService.GetUnreadNotificationsAsync(int userId, NotificationQueryParameters query, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    Task<PagedResult<NotificationDto>> INotificationService.GetUserNotificationsAsync(int userId, NotificationQueryParameters query, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    Task<int> INotificationService.MarkAllAsReadAsync(int userId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    Task<NotificationDto?> INotificationService.MarkAsReadAsync(int notificationId, int userId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    Task INotificationService.SendRealTimeNotificationAsync(NotificationDto notification, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }
}