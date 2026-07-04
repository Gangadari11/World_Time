namespace IFRS.Notifications.DTOs;

/// <summary>
/// Supports filtering and pagination when listing notifications.
/// </summary>
public sealed class NotificationQueryParameters
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public bool? IsRead { get; init; }
}
