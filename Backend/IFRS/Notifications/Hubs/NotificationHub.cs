using IFRS.Notifications.DTOs;
using IFRS.Notifications.Helpers;
using IFRS.Notifications.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace IFRS.Notifications.Hubs;

/// <summary>
/// Pushes user-specific notifications to the frontend over SignalR.
/// </summary>
[Authorize]
public sealed class NotificationHub : Hub
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(INotificationService notificationService, ILogger<NotificationHub> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public Task SendNotificationToUser(int userId, NotificationDto notification)
    {
        return Clients.User(userId.ToString()).SendAsync("ReceiveNotification", notification);
    }

    public Task BroadcastNotification(NotificationDto notification)
    {
        return Clients.All.SendAsync("ReceiveNotification", notification);
    }

    public async Task MarkAsRead(int notificationId)
    {
        var userId = Context.User.GetUserId();
        if (!userId.HasValue)
        {
            throw new HubException("Unable to identify the connected user.");
        }

        var updated = await _notificationService.MarkAsReadAsync(notificationId, userId.Value);
        if (updated == null)
        {
            throw new HubException("Notification not found.");
        }

        await Clients.User(userId.Value.ToString()).SendAsync("NotificationRead", updated);
        _logger.LogInformation("Notification {NotificationId} marked as read for user {UserId}.", notificationId, userId.Value);
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User.GetUserId();
        if (userId.HasValue)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId.Value}");
        }

        await base.OnConnectedAsync();
    }
}
