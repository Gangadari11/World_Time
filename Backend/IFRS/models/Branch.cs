using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IFRS.models;

[Table("branch")]
public class Branch
{
    [Key]
    [Column("pk_branch_id")]
    public int BranchId { get; set; }

    [Column("oracle_code")]
    [StringLength(100)]
    public string? OracleCode { get; set; }

    [Column("branch_code")]
    [StringLength(100)]
    public string? BranchCode { get; set; }

    [Column("branch_name")]
    [StringLength(255)]
    public string? BranchName { get; set; }

    [Column("lessee")]
    [StringLength(255)]
    public string? Lessee { get; set; }

    [Column("status")]
    [StringLength(50)]
    public string? Status { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public ICollection<Lease> Leases { get; set; } = new List<Lease>();
}
