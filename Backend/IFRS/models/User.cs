using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IFRS.models;

public enum UserRole
{
    admin,
    data_entry,
    auditor
}

[Table("user")]
public class User
{
    [Key]
    [Column("pk_user_id")]
    public int UserId { get; set; }

    [Column("password_hash")]
    [StringLength(255)]
    public string? PasswordHash { get; set; }

    [Column("full_name")]
    [StringLength(255)]
    public string? FullName { get; set; }

    [Column("email")]
    [StringLength(255)]
    public string? Email { get; set; }

    [Column("role")]
    public UserRole Role { get; set; } = UserRole.data_entry;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
