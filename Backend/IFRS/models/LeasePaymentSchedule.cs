using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IFRS.models;

[Table("lease_payment_schedule")]
public class LeasePaymentSchedule
{
    [Key]
    [Column("pk_payment_schedule_id")]
    public int PaymentScheduleId { get; set; }

    [Column("fk_lease_id")]
    public int? LeaseId { get; set; }

    [Column("lease_year")]
    public int? LeaseYear { get; set; }

    [Column("gross_amount")]
    public decimal? GrossAmount { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    [ForeignKey(nameof(LeaseId))]
    public Lease? Lease { get; set; }

}
