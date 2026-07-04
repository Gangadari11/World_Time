using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IFRS.models;

[Table("lessor")]
public class Lessor
{
    [Key]
    [Column("pk_lessor_id")]
    public int LessorId { get; set; }

    [Column("full_name")]
    [StringLength(255)]
    public string? FullName { get; set; }

    [Column("nic")]
    [StringLength(20)]
    public string? Nic { get; set; }

    [Column("address")]
    public string? Address { get; set; }

    [Column("bank_name")]
    [StringLength(255)]
    public string? BankName { get; set; }

    [Column("account_number")]
    [StringLength(100)]
    public string? AccountNumber { get; set; }

    [Column("bank_code")]
    [StringLength(100)]
    public string? BankCode { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public ICollection<Lease> Leases { get; set; } = new List<Lease>();
}
