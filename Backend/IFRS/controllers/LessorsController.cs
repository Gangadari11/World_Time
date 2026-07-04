using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using IFRS.Data;
using IFRS.models;
using IFRS.models.DTOs;
using IFRS.services;
using IFRS.Notifications.DTOs;
using IFRS.Notifications.Interfaces;
using IFRS.Notifications.Helpers;
using IFRS.Notifications.Filters;

namespace IFRS.controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class LessorsController : ControllerBase
{
    private readonly IFRSDbContext _context;
    private readonly EntityChangeRequestService _workflowService;

    public LessorsController(IFRSDbContext context, EntityChangeRequestService workflowService)
    {
        _context = context;
        _workflowService = workflowService;
    }

    // GET: api/lessors
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LessorDto>>> GetLessors()
    {
        var lessors = await _context.Lessors.ToListAsync();

        return Ok(lessors.Select(MapToLessorDto).ToList());
    }

    // GET: api/lessors/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<LessorDetailDto>> GetLessor(int id)
    {
        var lessor = await _context.Lessors
            .Include(l => l.Leases)
            .FirstOrDefaultAsync(l => l.LessorId == id);

        if (lessor == null)
        {
            return NotFound(new { message = "Lessor not found" });
        }

        return Ok(MapToLessorDetailDto(lessor));
    }

    // POST: api/lessors
    [HttpPost]
    [NotifyOnSuccess("Lessor created", "Lessor '{entityName}' was created by {userName} ({userRole}).", nameof(Lessor), NotificationScenario.DirectCreate)]

    public async Task<ActionResult<LessorDetailDto>> CreateLessor(Lessor lessor)
    {
        if (string.IsNullOrWhiteSpace(lessor.FullName))
        {
            return BadRequest(new { message = "Full name is required" });
        }

        lessor.CreatedAt = DateTime.UtcNow;
        lessor.UpdatedAt = DateTime.UtcNow;

        _context.Lessors.Add(lessor);
        await _context.SaveChangesAsync();

    

        var createdLessor = await _context.Lessors
            .Include(l => l.Leases)
            .FirstOrDefaultAsync(l => l.LessorId == lessor.LessorId);

        return CreatedAtAction(nameof(GetLessor), new { id = lessor.LessorId }, MapToLessorDetailDto(createdLessor!));
    }

    // PUT: api/lessors/{id}
    [HttpPut("{id}")]
    [Authorize]
    [NotifyOnSuccess("Lessor update submitted", "Lessor update request submitted by {userName} ({userRole}).", nameof(EntityChangeRequest), NotificationScenario.SubmitForApproval)]

    public async Task<IActionResult> UpdateLessor(int id, LessorUpdateRequestDto request)
    {
        if (id != request.LessorId)
        {
            return BadRequest(new { message = "ID mismatch" });
        }

        var currentUserId = User.GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized(new { message = "Invalid token." });
        }

        var result = await _workflowService.SubmitLessorUpdateAsync(currentUserId.Value, request);
        return StatusCode(result.StatusCode, new { message = result.Message, data = result.Data });
    }

    // DELETE: api/lessors/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLessor(int id)
    {
        var lessor = await _context.Lessors.FindAsync(id);
        if (lessor == null)
        {
            return NotFound(new { message = "Lessor not found" });
        }

        _context.Lessors.Remove(lessor);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Lessor deleted successfully" });
    }

    // GET: api/lessors/{id}/bank-code
    [HttpGet("{id}/bank-code")]
    public async Task<ActionResult> GetBankCode(int id)
    {
        var lessor = await _context.Lessors.FindAsync(id);
        if (lessor == null) return NotFound(new { message = "Lessor not found" });
        return Ok(new { lessorId = lessor.LessorId, bankCode = lessor.BankCode });
    }

    private static LessorDto MapToLessorDto(Lessor lessor)
    {
        return new LessorDto
        {
            LessorId = lessor.LessorId,
            FullName = lessor.FullName,
            Nic = lessor.Nic,
            Address = lessor.Address,
            BankName = lessor.BankName,
            AccountNumber = lessor.AccountNumber,
            BankCode = lessor.BankCode,
            CreatedAt = lessor.CreatedAt,
            UpdatedAt = lessor.UpdatedAt,
        };
    }

    private static LessorDetailDto MapToLessorDetailDto(Lessor lessor)
    {
        return new LessorDetailDto
        {
            LessorId = lessor.LessorId,
            FullName = lessor.FullName,
            Nic = lessor.Nic,
            Address = lessor.Address,
            BankName = lessor.BankName,
            AccountNumber = lessor.AccountNumber,
            BankCode = lessor.BankCode,
            CreatedAt = lessor.CreatedAt,
            UpdatedAt = lessor.UpdatedAt,
            Leases = lessor.Leases.Select(lease => new LeaseSimpleDto
            {
                LeaseId = lease.LeaseId,
                BranchId = lease.BranchId,
                LessorId = lease.LessorId,
                LeaseNo = lease.LeaseNo,
                LeasePropertyAddress = lease.LeasePropertyAddress,
                Sqft = lease.Sqft,
                StartDate = lease.StartDate,
                EndDate = lease.EndDate,
                Extensions = lease.Extensions,
                NumberOfYears = lease.NumberOfYears,
                RemainingPeriod = LeasePeriodHelper.CalculateRemainingPeriod(lease.EndDate),
                RentAdvance = lease.RentAdvance,
                RentAdvancePeriod = lease.RentAdvancePeriod,
                RefundableDeposit = lease.RefundableDeposit,
                NoticePeriodMonths = lease.NoticePeriodMonths,
                Remarks = lease.Remarks,
                AgreementValue = lease.AgreementValue,
                AnnualRate = lease.AnnualRate,
                LeaseStatus = lease.LeaseStatus,
                CreatedAt = lease.CreatedAt,
                UpdatedAt = lease.UpdatedAt,
            }).ToList()
        };
    }
}
