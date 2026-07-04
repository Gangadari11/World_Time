using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IFRS.models;

[Table("lease")]
public class Lease
{
    [Key]
    [Column("pk_lease_id")]
    public int LeaseId { get; set; }

    [Column("fk_branch_id")]
    [ForeignKey("Branch")]
    public int? BranchId { get; set; }

    [Column("fk_lessor_id")]
    [ForeignKey("Lessor")]
    public int? LessorId { get; set; }

    [Column("lease_no")]
    [StringLength(100)]
    public string? LeaseNo { get; set; }

    [Column("lease_property_address")]
    public string? LeasePropertyAddress { get; set; }

    [Column("sqft")]
    public int? Sqft { get; set; }

    [Column("start_date")]
    public DateOnly? StartDate { get; set; }

    [Column("end_date")]
    public DateOnly? EndDate { get; set; }

    [Column("extensions")]
    public string? Extensions { get; set; }

    [Column("number_of_years")]
    public int? NumberOfYears { get; set; }

    [Column("rent_advance")]
    public decimal? RentAdvance { get; set; }

    [Column("rent_advance_period")]
    public int? RentAdvancePeriod { get; set; }

    [Column("refundable_deposit")]
    public decimal? RefundableDeposit { get; set; }

    [Column("notice_period_months")]
    public int? NoticePeriodMonths { get; set; }

    [Column("remarks")]
    public string? Remarks { get; set; }

    [Column("agreement_value")]
    public decimal? AgreementValue { get; set; }

    [Column("annual_rate")]
    public decimal? AnnualRate { get; set; }

    [Column("utility_bill")]
    public decimal? UtilityBill { get; set; }

    [Column("wht_rate")]
    public decimal? WhtRate { get; set; }

    [Column("vat_rate")]
    public decimal? VatRate { get; set; }

    [Column("lease_status")]
    [StringLength(50)]
    public string? LeaseStatus { get; set; }

    [Column("is_paid_at_beginning")]
    public bool IsPaymentAtBeginning { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Branch? Branch { get; set; }
    public Lessor? Lessor { get; set; }
    public ICollection<LeasePaymentSchedule> PaymentSchedules { get; set; } = new List<LeasePaymentSchedule>();
}
