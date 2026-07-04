using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IFRS.models;

/// <summary>
/// Stores a single user notification and its read state.
/// </summary>
[Table("notifications")]
public class Notification
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("title")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Column("message")]
    public string Message { get; set; } = string.Empty;

    [Column("type")]
    public NotificationType Type { get; set; }

    [Column("is_read")]
    public bool IsRead { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("reference_id")]
    [MaxLength(100)]
    public string? ReferenceId { get; set; }

    [Column("reference_type")]
    [MaxLength(100)]
    public string? ReferenceType { get; set; }

    public User? User { get; set; }
}
