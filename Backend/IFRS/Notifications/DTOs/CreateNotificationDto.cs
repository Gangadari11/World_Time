using IFRS.models;

namespace IFRS.Notifications.DTOs;

/// <summary>
/// Command payload for creating notifications for one or many users.
/// </summary>
public sealed class CreateNotificationDto
{
    public int? UserId { get; init; }
    public IReadOnlyCollection<int>? UserIds { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public NotificationType Type { get; init; }
    public string? ReferenceId { get; init; }
    public string? ReferenceType { get; init; }
}
