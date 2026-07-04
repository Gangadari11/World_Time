using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using IFRS.Data;
using IFRS.models;
using IFRS.models.DTOs;

namespace IFRS.controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class LeasePaymentSchedulesController : ControllerBase
{
    private readonly IFRSDbContext _context;

    public LeasePaymentSchedulesController(IFRSDbContext context)
    {
        _context = context;
    }

    // GET: api/leasepaymentschedules
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeasePaymentSchedule>>> GetLeasePaymentSchedules()
    {
        return await _context.LeasePaymentSchedules
            .ToListAsync();
    }

    // GET: api/leasepaymentschedules/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<LeasePaymentSchedule>> GetLeasePaymentSchedule(int id)
    {
        var paymentSchedule = await _context.LeasePaymentSchedules
            .FirstOrDefaultAsync(lps => lps.PaymentScheduleId == id);

        if (paymentSchedule == null)
        {
            return NotFound(new { message = "Payment schedule not found" });
        }

        return paymentSchedule;
    }

    // GET: api/leasepaymentschedules/lease/{leaseId}
    [HttpGet("lease/{leaseId}")]
    public async Task<ActionResult<IEnumerable<LeasePaymentSchedule>>> GetPaymentSchedulesByLease(int leaseId)
    {
        var paymentSchedules = await _context.LeasePaymentSchedules
            .Where(lps => lps.LeaseId == leaseId)
            .OrderBy(lps => lps.LeaseYear)
            .ToListAsync();

        return paymentSchedules;
    }

    // POST: api/leasepaymentschedules
    [HttpPost]
    public async Task<ActionResult<IEnumerable<LeasePaymentSchedule>>> CreateLeasePaymentSchedules(BulkLeasePaymentScheduleDto dto)
    {
        if (!await _context.Leases.AnyAsync(l => l.LeaseId == dto.LeaseId))
            return BadRequest(new { message = "Invalid LeaseId" });

        if (await _context.LeasePaymentSchedules.AnyAsync(lps => lps.LeaseId == dto.LeaseId))
            return Conflict(new { message = "Payment schedules already exist for this lease" });

        if (dto.YearlyPayments == null || dto.YearlyPayments.Count == 0)
            return BadRequest(new { message = "At least one yearly payment entry is required" });

        if (dto.YearlyPayments.Any(y => y.GrossAmount < 0))
            return BadRequest(new { message = "Gross amount must be non-negative" });

        if (dto.YearlyPayments.Any(y => y.LeaseYear <= 0))
            return BadRequest(new { message = "Lease year must be greater than zero" });

        if (dto.YearlyPayments.Select(y => y.LeaseYear).Distinct().Count() != dto.YearlyPayments.Count)
            return BadRequest(new { message = "Duplicate lease year values are not allowed" });

        var schedules = dto.YearlyPayments.Select(y => new LeasePaymentSchedule
        {
            LeaseId = dto.LeaseId,
            LeaseYear = y.LeaseYear,
            GrossAmount = y.GrossAmount,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }).ToList();

        _context.LeasePaymentSchedules.AddRange(schedules);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPaymentSchedulesByLease), new { leaseId = dto.LeaseId }, schedules);
    }

    // PUT: api/leasepaymentschedules/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateLeasePaymentSchedule(int id, YearlyPaymentDto paymentSchedule)
    {
        var existingPaymentSchedule = await _context.LeasePaymentSchedules.FindAsync(id);
        if (existingPaymentSchedule == null)
            return NotFound(new { message = "Payment schedule not found" });

        existingPaymentSchedule.LeaseYear = paymentSchedule.LeaseYear;
        existingPaymentSchedule.GrossAmount = paymentSchedule.GrossAmount;
        existingPaymentSchedule.UpdatedAt = DateTime.UtcNow;

        _context.LeasePaymentSchedules.Update(existingPaymentSchedule);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Payment schedule updated successfully", data = existingPaymentSchedule });
    }

    // DELETE: api/leasepaymentschedules/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLeasePaymentSchedule(int id)
    {
        var paymentSchedule = await _context.LeasePaymentSchedules.FindAsync(id);
        if (paymentSchedule == null)
        {
            return NotFound(new { message = "Payment schedule not found" });
        }

        _context.LeasePaymentSchedules.Remove(paymentSchedule);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Payment schedule deleted successfully" });
    }
}
