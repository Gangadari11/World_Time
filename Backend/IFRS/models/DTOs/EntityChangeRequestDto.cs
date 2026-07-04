using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace IFRS.models.DTOs;

public class SubmitEntityChangeRequestDto
{
    [Required]
    public int EntityId { get; set; }

    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ApprovalEntityType EntityType { get; set; }

    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ApprovalOperation Operation { get; set; } = ApprovalOperation.Update;

    public JsonElement? OldValueSnapshot { get; set; }

    [Required]
    public JsonElement NewValueSnapshot { get; set; }

    public DateTime? EntityUpdatedAtSnapshot { get; set; }

    [StringLength(1000)]
    public string? RequestComments { get; set; }
}

public class ReviewEntityChangeRequestDto
{
    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ApprovalRequestStatus Status { get; set; }

    [StringLength(1000)]
    public string? ReviewComments { get; set; }
}

public class EntityChangeRequestDto
{
    public int EntityChangeRequestId { get; set; }
    public int EntityId { get; set; }
    public string? EntityType { get; set; }
    public EntitySummaryDto? EntitySummary { get; set; }
    public string? Operation { get; set; }
    public JsonElement? OldValueSnapshot { get; set; }
    public JsonElement NewValueSnapshot { get; set; }
    public string? Status { get; set; }
    public int RequestedBy { get; set; }
    public UserSummaryDto? RequestedByUser { get; set; }
    public DateTime RequestedAt { get; set; }
    public string? RequestComments { get; set; }
    public int? ReviewedBy { get; set; }
    public UserSummaryDto? ReviewedByUser { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewComments { get; set; }
    public DateTime? EntityUpdatedAtSnapshot { get; set; }
}

public class UserSummaryDto
{
    public int UserId { get; set; }
    public string? FullName { get; set; }
    public string? Email { get; set; }
}

public class EntitySummaryDto
{
    public int EntityId { get; set; }
    public string? EntityType { get; set; }
    public string? Name { get; set; }
    public string? Reference { get; set; }
}

public class LessorUpdateRequestDto
{
    [Required]
    public int LessorId { get; set; }

    [StringLength(255)]
    public string? FullName { get; set; }

    [StringLength(20)]
    public string? Nic { get; set; }

    public string? Address { get; set; }

    [StringLength(255)]
    public string? BankName { get; set; }

    [StringLength(100)]
    public string? AccountNumber { get; set; }

    [StringLength(100)]
    public string? BankCode { get; set; }

    [StringLength(1000)]
    public string? RequestComments { get; set; }
}

public class LeaseUpdateRequestDto
{
    [Required]
    public int LeaseId { get; set; }

    public int? BranchId { get; set; }

    public int? LessorId { get; set; }

    [StringLength(100)]
    public string? LeaseNo { get; set; }

    public string? LeasePropertyAddress { get; set; }

    public int? Sqft { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public string? Extensions { get; set; }

    public int? NumberOfYears { get; set; }

    public decimal? RentAdvance { get; set; }

    public int? RentAdvancePeriod { get; set; }

    public decimal? RefundableDeposit { get; set; }

    public int? NoticePeriodMonths { get; set; }

    public string? Remarks { get; set; }

    public decimal? AgreementValue { get; set; }

    public decimal? AnnualRate { get; set; }

    public decimal? UtilityBill { get; set; }

    public decimal? WhtRate { get; set; }

    public decimal? VatRate { get; set; }

    [StringLength(50)]
    public string? LeaseStatus { get; set; }

    public bool IsPaymentAtBeginning { get; set; }

    [StringLength(1000)]
    public string? RequestComments { get; set; }
}