using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace IFRS.models;

public enum ApprovalEntityType
{
    Branch,
    Lease,
    Lessor
}

public enum ApprovalOperation
{
    Create,
    Update,
    Delete
}

public enum ApprovalRequestStatus
{
    Pending,
    Approved,
    Rejected
}

[Table("entity_change_request")]
public class EntityChangeRequest
{
    [Key]
    [Column("pk_entity_change_request_id")]
    public int EntityChangeRequestId { get; set; }

    [Column("entity_id")]
    public int EntityId { get; set; }

    [Column("entity_type")]
    public ApprovalEntityType EntityType { get; set; }

    [Column("operation")]
    public ApprovalOperation Operation { get; set; } = ApprovalOperation.Update;

    [Column("old_value_snapshot", TypeName = "jsonb")]
    public JsonElement? OldValueSnapshot { get; set; }

    [Column("new_value_snapshot", TypeName = "jsonb")]
    public JsonElement NewValueSnapshot { get; set; }

    [Column("status")]
    public ApprovalRequestStatus Status { get; set; } = ApprovalRequestStatus.Pending;

    [Column("requested_by")]
    public int RequestedBy { get; set; }

    [Column("requested_at")]
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    [Column("request_comments")]
    [StringLength(1000)]
    public string? RequestComments { get; set; }

    [Column("reviewed_by")]
    public int? ReviewedBy { get; set; }

    [Column("reviewed_at")]
    public DateTime? ReviewedAt { get; set; }

    [Column("review_comments")]
    [StringLength(1000)]
    public string? ReviewComments { get; set; }

    [Column("entity_updated_at_snapshot")]
    public DateTime? EntityUpdatedAtSnapshot { get; set; }
}