namespace IFRS.models.DTOs;

public class BranchDto
{
    public int BranchId { get; set; }
    public string? OracleCode { get; set; }
    public string? BranchCode { get; set; }
    public string? BranchName { get; set; }
    public string? Lessee { get; set; }
    public string? Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class BranchLeaseDto
{
    public int? BranchId { get; set; }
    public string? LeaseNo { get; set; }
    public string? Lessor { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? LeasePropertyAddress { get; set; }
    public string? Status { get; set; }
}

public class BranchDetailDto
{
    public int BranchId { get; set; }
    public string? OracleCode { get; set; }
    public string? BranchCode { get; set; }
    public string? BranchName { get; set; }
    public string? Lessee { get; set; }
    public string? Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public bool? HasPendingChangeRequest { get; set; }
    
    // Include Leases collection without nested Branch reference
    public ICollection<BranchLeaseDto> Leases { get; set; } = new List<BranchLeaseDto>();
}

public class BranchUpdateRequestDto
{
    public int BranchId { get; set; }
    public string? OracleCode { get; set; }
    public string? BranchCode { get; set; }
    public string? BranchName { get; set; }
    public string? Lessee { get; set; }
    public string? Status { get; set; }
    public string? RequestComments { get; set; }
}

public class BranchUpdateValueSnapshotDto
{
    public int BranchId { get; set; }
    public string? OracleCode { get; set; }
    public string? BranchCode { get; set; }
    public string? BranchName { get; set; }
    public string? Lessee { get; set; }
    public string? Status { get; set; }
}
