using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using IFRS.Data;
using IFRS.models;
using IFRS.models.DTOs;
using IFRS.services;
using IFRS.Notifications.Filters;

namespace IFRS.controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class BranchesController : ControllerBase
{
    private readonly IFRSDbContext _context;
    private readonly EntityChangeRequestService _workflowService;

    public BranchesController(IFRSDbContext context, EntityChangeRequestService workflowService)
    {
        _context = context;
        _workflowService = workflowService;
    }

    // Helper method to map Branch to BranchDetailDto
    private async Task<BranchDetailDto> MapToBranchDetailDto(Branch branch)
    {
        return new BranchDetailDto
        {
            BranchId = branch.BranchId,
            OracleCode = branch.OracleCode,
            BranchCode = branch.BranchCode,
            BranchName = branch.BranchName,
            Lessee = branch.Lessee,
            Status = branch.Status,
            CreatedAt = branch.CreatedAt,
            UpdatedAt = branch.UpdatedAt,
            HasPendingChangeRequest = await _workflowService.HasPendingRequestAsync(ApprovalEntityType.Branch, branch.BranchId),
            Leases = branch.Leases.Select(l => new BranchLeaseDto
            {
                BranchId = l.BranchId,
                Lessor = l.Lessor?.FullName,
                LeaseNo = l.LeaseNo,
                LeasePropertyAddress = l.LeasePropertyAddress,
                StartDate = l.StartDate,
                EndDate = l.EndDate,
                Status = l.LeaseStatus,
            }).ToList() ?? new List<BranchLeaseDto>()
        };
    }

    // Helper method to map Branch to BranchDto
    private BranchDto MapToListDto(Branch branch)
    {
        return new BranchDto
        {
            BranchId = branch.BranchId,
            OracleCode = branch.OracleCode,
            BranchCode = branch.BranchCode,
            BranchName = branch.BranchName,
            Lessee = branch.Lessee,
            Status = branch.Status,
            CreatedAt = branch.CreatedAt,
            UpdatedAt = branch.UpdatedAt
        };
    }

    // GET: api/branches
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BranchDto>>> GetBranches()
    {
        var branches = await _context.Branches.ToListAsync();
        return Ok(branches.Select(MapToListDto));
    }

    // GET: api/branches/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<BranchDetailDto>> GetBranch(int id)
    {
        var branch = await _context.Branches
            .Include(b => b.Leases)
            .ThenInclude(l => l.Lessor)
            .FirstOrDefaultAsync(b => b.BranchId == id);

        if (branch == null)
        {
            return NotFound(new { message = "Branch not found" });
        }

        return Ok(await MapToBranchDetailDto(branch));
    }

    // POST: api/branches
    [HttpPost]
    [NotifyOnSuccess("Branch created", "Branch '{entityName}' has been created successfully.", nameof(Branch))]
    public async Task<ActionResult<BranchDetailDto>> CreateBranch(Branch branch)
    {
        if (string.IsNullOrWhiteSpace(branch.BranchName))
        {
            return BadRequest(new { message = "Branch name is required" });
        }

        branch.CreatedAt = DateTime.UtcNow;
        branch.UpdatedAt = DateTime.UtcNow;

        _context.Branches.Add(branch);
        await _context.SaveChangesAsync();

                
        return CreatedAtAction(nameof(GetBranch), new { id = branch.BranchId }, new BranchDetailDto
        {
            BranchId = branch.BranchId,
            OracleCode = branch.OracleCode,
            BranchCode = branch.BranchCode,
            BranchName = branch.BranchName,
            Lessee = branch.Lessee,
            Status = branch.Status,
            CreatedAt = branch.CreatedAt,
            UpdatedAt = branch.UpdatedAt
        });
    }

    // PUT: api/branches/{id}
    [HttpPut("{id}")]
    [NotifyOnSuccess("Branch update submitted", "Branch update request submitted by {userName} ({userRole}).", nameof(EntityChangeRequest), NotificationScenario.SubmitForApproval)]

    public async Task<IActionResult> UpdateBranch(int id, BranchUpdateRequestDto request)
    {
        if (id != request.BranchId)
        {
            return BadRequest(new { message = "ID mismatch" });
        }

        var currentUserId = User.GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized(new { message = "Invalid token." });
        }

        var result = await _workflowService.SubmitBranchUpdateAsync(currentUserId.Value, request);
        return StatusCode(result.StatusCode, new { message = result.Message, data = result.Data });
    }

    // GET: api/branches/{id}/branch-code
    [HttpGet("{id}/branch-code")]
    public async Task<ActionResult<string>> GetBranchCode(int id)
    {
        var branch = await _context.Branches.FindAsync(id);
        if (branch == null)
        {
            return NotFound(new { message = "Branch not found" });
        }
        return Ok(new { branchId = branch.BranchId, branchCode = branch.BranchCode });
    }

    // DELETE: api/branches/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteBranch(int id)
    {
        var branch = await _context.Branches.FindAsync(id);
        if (branch == null)
        {
            return NotFound(new { message = "Branch not found" });
        }

        _context.Branches.Remove(branch);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Branch deleted successfully" });
    }
}
