using IFRS.Notifications.DTOs;
using IFRS.Notifications.Helpers;
using IFRS.Notifications.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IFRS.Controllers;

/// <summary>
/// CRUD and history endpoints for the signed-in user's notifications.
/// </summary>
[ApiController]
[Authorize]
[Route("api/notifications")]
public sealed class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] NotificationQueryParameters query, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (!userId.HasValue)
            return Unauthorized(new { message = "Invalid token." });

        var result = await _notificationService.GetUserNotificationsAsync(userId.Value, query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("unread")]
    public async Task<IActionResult> GetUnreadNotifications([FromQuery] NotificationQueryParameters query, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (!userId.HasValue)
            return Unauthorized(new { message = "Invalid token." });

        var result = await _notificationService.GetUnreadNotificationsAsync(userId.Value, query, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (!userId.HasValue)
            return Unauthorized(new { message = "Invalid token." });

        var notification = await _notificationService.MarkAsReadAsync(id, userId.Value, cancellationToken);
        if (notification == null)
            return NotFound(new { message = "Notification not found." });

        return Ok(notification);
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (!userId.HasValue)
            return Unauthorized(new { message = "Invalid token." });

        var affected = await _notificationService.MarkAllAsReadAsync(userId.Value, cancellationToken);
        return Ok(new { affected });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (!userId.HasValue)
            return Unauthorized(new { message = "Invalid token." });

        await _notificationService.DeleteAsync(id, userId.Value, cancellationToken);
        return NoContent();
    }
}