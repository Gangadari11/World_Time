namespace IFRS.Notifications.DTOs;

/// <summary>
/// Notification payload returned to clients.
/// </summary>
public sealed class NotificationDto
{
    public int Id { get; init; }
    public int UserId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public bool IsRead { get; init; }
    public DateTime CreatedAt { get; init; }
    public string? ReferenceId { get; init; }
    public string? ReferenceType { get; init; }
}
