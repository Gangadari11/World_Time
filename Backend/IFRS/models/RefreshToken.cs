using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IFRS.models;

[Table("refresh_tokens")]
public class RefreshToken
{
    [Key]
    [Column("pk_refresh_token_id")]
    public int RefreshTokenId { get; set; }

    [Column("fk_user_id")]
    public int UserId { get; set; }

    [Column("token")]
    public string Token { get; set; } = string.Empty;

    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
