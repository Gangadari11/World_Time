using IFRS.Notifications.DTOs;
using IFRS.models;

namespace IFRS.Notifications.Mappings;

/// <summary>
/// Maps notification entities to DTOs.
/// </summary>
public static class NotificationMappings
{
    public static NotificationDto ToDto(this Notification notification)
    {
        return new NotificationDto
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type.ToString(),
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt,
            ReferenceId = notification.ReferenceId,
            ReferenceType = notification.ReferenceType
        };
    }
}
