using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using IFRS.Data;
using IFRS.models;
using IFRS.models.DTOs;
using IFRS.Notifications.Filters;
using IFRS.services;

namespace IFRS.controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class LeasesController : ControllerBase
{
    private readonly IFRSDbContext _context;
    private readonly CashflowService _cashflowService;
    private readonly EntityChangeRequestService _workflowService;

    public LeasesController(IFRSDbContext context, CashflowService cashflowService, EntityChangeRequestService workflowService)
    {
        _context = context;
        _cashflowService = cashflowService;
        _workflowService = workflowService;
    }

    private static bool IsActiveStatus(string? status) =>
        string.Equals(status, "Active", StringComparison.OrdinalIgnoreCase);

    private static bool IsTerminatedStatus(string? status) =>
        string.Equals(status, "Terminate", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(status, "Terminated", StringComparison.OrdinalIgnoreCase);

    private static int GetRenewalWindowDays(Lease lease)
    {
        return lease.NoticePeriodMonths.HasValue && lease.NoticePeriodMonths.Value > 0
            ? lease.NoticePeriodMonths.Value * 30
            : 90;
    }

    private async Task<IReadOnlyList<int>> GetAdminUserIdsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Where(user => user.Role == UserRole.admin)
            .Select(user => user.UserId)
            .ToListAsync(cancellationToken);
    }

    

    

    
    // Helper method to map Lease to LeaseDto
    private LeaseDto MapToDto(Lease lease)
    {
        return new LeaseDto
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
            UtilityBill = lease.UtilityBill,
            WhtRate = lease.WhtRate,
            VatRate = lease.VatRate,
            LeaseStatus = lease.LeaseStatus,
            IsPaymentAtBeginning = lease.IsPaymentAtBeginning,
            OutstandingReceivableFromLessor = _cashflowService.CalculateOutstandingReceivable(lease),
            CreatedAt = lease.CreatedAt,
            UpdatedAt = lease.UpdatedAt,
            Branch = lease.Branch != null ? new LeaseBranchDto
            {
                BranchId = lease.Branch.BranchId,
                OracleCode = lease.Branch.OracleCode,
                BranchCode = lease.Branch.BranchCode,
                BranchName = lease.Branch.BranchName,
                Lessee = lease.Branch.Lessee,
                Status = lease.Branch.Status,
                CreatedAt = lease.Branch.CreatedAt,
                UpdatedAt = lease.Branch.UpdatedAt
            } : null,
            Lessor = lease.Lessor != null ? new LessorDto
            {
                LessorId = lease.Lessor.LessorId,
                FullName = lease.Lessor.FullName,
                Nic = lease.Lessor.Nic,
                Address = lease.Lessor.Address,
                BankName = lease.Lessor.BankName,
                AccountNumber = lease.Lessor.AccountNumber,
                BankCode = lease.Lessor.BankCode,
                CreatedAt = lease.Lessor.CreatedAt,
                UpdatedAt = lease.Lessor.UpdatedAt
            } : null,
            PaymentSchedules = lease.PaymentSchedules?.Select(ps => new LeasePaymentScheduleDto
            {
                PaymentScheduleId = ps.PaymentScheduleId,
                LeaseId = ps.LeaseId,
                LeaseYear = ps.LeaseYear,
                GrossAmount = ps.GrossAmount,
                CreatedAt = ps.CreatedAt,
                UpdatedAt = ps.UpdatedAt
            }).ToList() ?? new List<LeasePaymentScheduleDto>()
        };
    }

    private static decimal? CalculateRemainingPeriodYears(DateOnly? endDate, DateOnly today)
    {
        if (endDate == null)
        {
            return null;
        }

        var dayDifference = endDate.Value.DayNumber - today.DayNumber;
        return Math.Round(dayDifference / 365.25m, 2);
    }

    private static decimal?[] BuildScheduleColumns(IEnumerable<LeasePaymentSchedule> schedules, int? numberOfYears)
    {
        var columns = new decimal?[6];

        foreach (var schedule in schedules.OrderBy(s => s.LeaseYear))
        {
            if (schedule.LeaseYear == null || schedule.LeaseYear < 1 || schedule.LeaseYear > 6)
            {
                continue;
            }

            var index = schedule.LeaseYear.Value - 1;

            if (numberOfYears.HasValue && schedule.LeaseYear > numberOfYears)
            {
                continue;
            }

            columns[index] = schedule.GrossAmount;
        }

        return columns;
    }

    private static IReadOnlyDictionary<int, List<LeasePaymentSchedule>> GroupSchedulesByLease(IEnumerable<LeasePaymentSchedule> schedules)
    {
        return schedules
            .Where(schedule => schedule.LeaseId.HasValue)
            .GroupBy(schedule => schedule.LeaseId!.Value)
            .ToDictionary(group => group.Key, group => group.ToList());
    }

    // GET: api/leases/ifrs16-report
    [HttpGet("ifrs16-report")]
    public async Task<ActionResult<IEnumerable<Ifrs16LeaseIndentureSummaryRowDto>>> GetIfrs16LeaseIndentureSummaryReport([FromQuery] Ifrs16ReportFilterDto filter)
    {
        var query = _context.Leases
            .Include(l => l.Branch)
            .Include(l => l.Lessor)
            .AsQueryable();

        if (filter.BranchId.HasValue)
        {
            query = query.Where(l => l.BranchId == filter.BranchId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.LeaseStatus))
        {
            var normalizedLeaseStatus = filter.LeaseStatus.Trim().ToLower();
            query = query.Where(l => l.LeaseStatus != null && l.LeaseStatus.ToLower() == normalizedLeaseStatus);
        }

        if (filter.StartDateFrom.HasValue)
        {
            query = query.Where(l => l.StartDate != null && l.StartDate.Value >= filter.StartDateFrom.Value);
        }

        if (filter.StartDateTo.HasValue)
        {
            query = query.Where(l => l.StartDate != null && l.StartDate.Value <= filter.StartDateTo.Value);
        }

        if (filter.EndDateFrom.HasValue)
        {
            query = query.Where(l => l.EndDate != null && l.EndDate.Value >= filter.EndDateFrom.Value);
        }

        if (filter.EndDateTo.HasValue)
        {
            query = query.Where(l => l.EndDate != null && l.EndDate.Value <= filter.EndDateTo.Value);
        }

        var leases = await query
            .OrderBy(l => l.Branch!.OracleCode)
            .ThenBy(l => l.LeaseNo)
            .ToListAsync();

        var leaseIds = leases.Select(lease => lease.LeaseId).ToList();
        var paymentSchedules = await _context.LeasePaymentSchedules
            .Where(schedule => schedule.LeaseId.HasValue && leaseIds.Contains(schedule.LeaseId.Value))
            .OrderBy(schedule => schedule.LeaseId)
            .ThenBy(schedule => schedule.LeaseYear)
            .ToListAsync();

        var schedulesByLeaseId = GroupSchedulesByLease(paymentSchedules);
        var today = DateOnly.FromDateTime(DateTime.Today);

        var reportRows = leases.Select(lease =>
        {
            schedulesByLeaseId.TryGetValue(lease.LeaseId, out var leaseSchedules);
            var scheduleRows = leaseSchedules ?? new List<LeasePaymentSchedule>();

            var scheduledColumns = BuildScheduleColumns(scheduleRows, lease.NumberOfYears);
            var actualColumns = scheduledColumns;
            var rentAdvancePeriod = lease.RentAdvancePeriod.GetValueOrDefault();
            decimal? requiredDeductionFromMonthlyRental =
                rentAdvancePeriod > 0
                    ? Math.Round(lease.RentAdvance.GetValueOrDefault() / rentAdvancePeriod, 2)
                    : null;

            var isTerminated = string.Equals(lease.LeaseStatus, "Terminate", StringComparison.OrdinalIgnoreCase);

            int? monthsToRecover = null;
            int? monthsRecovered = null;
            int? balanceMonthsToBeRecovered = null;
            decimal? rentAdvanceRecoveryPerMonth = null;
            decimal? totalRentAdvanceRecovery = null;
            decimal? totalOutstandingReceivable = null;

            if (isTerminated && lease.RentAdvancePeriod.HasValue && lease.RentAdvancePeriod.Value > 0)
            {
                monthsToRecover = lease.RentAdvancePeriod.Value;

                if (lease.StartDate.HasValue)
                {
                    var referenceDate = lease.EndDate.HasValue && lease.EndDate.Value < today
                        ? lease.EndDate.Value
                        : today;

                    var elapsed = CashflowService.CalculateElapsedMonths(lease.StartDate.Value, referenceDate);
                    monthsRecovered = Math.Min(elapsed, lease.RentAdvancePeriod.Value);
                }
                else
                {
                    monthsRecovered = 0;
                }

                balanceMonthsToBeRecovered = Math.Max(monthsToRecover.GetValueOrDefault() - monthsRecovered.GetValueOrDefault(), 0);

                if (lease.RentAdvance.HasValue && lease.RentAdvancePeriod.HasValue && lease.RentAdvancePeriod.Value > 0)
                {
                    rentAdvanceRecoveryPerMonth = Math.Round(lease.RentAdvance.Value / lease.RentAdvancePeriod.Value, 2);
                    totalRentAdvanceRecovery = Math.Round(balanceMonthsToBeRecovered.GetValueOrDefault() * rentAdvanceRecoveryPerMonth.GetValueOrDefault(), 2);
                }

                totalOutstandingReceivable = Math.Round((totalRentAdvanceRecovery.GetValueOrDefault() + lease.RefundableDeposit.GetValueOrDefault()), 2);
            }

            return new Ifrs16LeaseIndentureSummaryRowDto
            {
                LeaseId = lease.LeaseId,
                OracleCode = lease.Branch?.OracleCode,
                BranchCode = lease.Branch?.BranchCode,
                BranchName = lease.Branch?.BranchName,
                Lessee = lease.Branch?.Lessee,
                LessorFullName = lease.Lessor?.FullName,
                LeaseNo = lease.LeaseNo,
                Nic = lease.Lessor?.Nic,
                LessorAddress = lease.Lessor?.Address,
                Sqft = lease.Sqft,
                LeasePropertyAddress = lease.LeasePropertyAddress,
                StartDate = lease.StartDate,
                EndDate = lease.EndDate,
                Extensions = lease.Extensions,
                NumberOfYears = lease.NumberOfYears,
                Today = today,
                RemainingPeriodYears = CalculateRemainingPeriodYears(lease.EndDate, today),
                FirstYearScheduledAmount = scheduledColumns[0],
                SecondYearScheduledAmount = scheduledColumns[1],
                ThirdYearScheduledAmount = scheduledColumns[2],
                FourthYearScheduledAmount = scheduledColumns[3],
                FifthYearScheduledAmount = scheduledColumns[4],
                SixthYearScheduledAmount = scheduledColumns[5],
                FirstYearActualAmount = actualColumns[0],
                SecondYearActualAmount = actualColumns[1],
                ThirdYearActualAmount = actualColumns[2],
                FourthYearActualAmount = actualColumns[3],
                FifthYearActualAmount = actualColumns[4],
                SixthYearActualAmount = actualColumns[5],
                AccountNumber = lease.Lessor?.AccountNumber,
                BankName = lease.Lessor?.BankName,
                RentAdvance = lease.RentAdvance,
                RefundableDeposit = lease.RefundableDeposit,
                NoticePeriodMonths = lease.NoticePeriodMonths,
                Remarks = lease.Remarks,
                RentAdvancePeriod = lease.RentAdvancePeriod,
                RequiredDeductionFromMonthlyRental = requiredDeductionFromMonthlyRental,
                AgreementValue = lease.AgreementValue,
                LeaseStatus = lease.LeaseStatus,
                MonthsToRecoverRentAdvance = monthsToRecover,
                MonthsRecovered = monthsRecovered,
                BalanceMonthsToBeRecovered = balanceMonthsToBeRecovered,
                RentAdvanceRecoveryPerMonth = rentAdvanceRecoveryPerMonth,
                TotalRentAdvanceRecovery = totalRentAdvanceRecovery,
                TotalOutstandingReceivable = totalOutstandingReceivable,
            };
        }).ToList();

        return Ok(reportRows);
    }

    // GET: api/leases
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeaseDto>>> GetLeases()
    {
        var leases = await _context.Leases
            .Include(l => l.Branch)
            .Include(l => l.Lessor)
            .Include(l => l.PaymentSchedules)
            .ToListAsync();

        return Ok(leases.Select(MapToDto).ToList());
    }

    // GET: api/leases/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<LeaseDto>> GetLease(int id)
    {
        var lease = await _context.Leases
            .Include(l => l.Branch)
            .Include(l => l.Lessor)
            .Include(l => l.PaymentSchedules)
            .FirstOrDefaultAsync(l => l.LeaseId == id);

        if (lease == null)
        {
            return NotFound(new { message = "Lease not found" });
        }

        return Ok(MapToDto(lease));
    }

    // GET: api/leases/branch/{branchId}
    [HttpGet("branch/{branchId}")]
    public async Task<ActionResult<IEnumerable<LeaseDto>>> GetLeasesByBranch(int branchId)
    {
        var leases = await _context.Leases
            .Where(l => l.BranchId == branchId)
            .Include(l => l.Branch)
            .Include(l => l.Lessor)
            .Include(l => l.PaymentSchedules)
            .ToListAsync();

        return Ok(leases.Select(MapToDto).ToList());
    }

    // GET: api/leases/{id}/payment-cashflows
    [HttpGet("{id}/payment-cashflows")]
    public async Task<ActionResult<CashflowResponseDto>> GetPaymentCashflows(int id)
    {
        var lease = await _context.Leases
            .Include(l => l.PaymentSchedules)
            .FirstOrDefaultAsync(l => l.LeaseId == id);

        if (lease == null)
            return NotFound(new { message = "Lease not found" });

        if (lease.StartDate == null || lease.EndDate == null)
            return BadRequest(new { message = "Lease start date and end date are required" });

        if (lease.AnnualRate == null)
            return BadRequest(new { message = "Lease annual rate is required" });

        var result = _cashflowService.CalculateCashflowSchedule(lease, lease.PaymentSchedules.ToList());
        return Ok(result);
    }

    // GET: api/leases/{id}/payment-cashflow-summary
    [HttpGet("{id}/payment-cashflow-summary")]
    public async Task<ActionResult<CashflowSummaryDto>> GetPaymentCashflowSummary(int id)
    {
        var lease = await _context.Leases
            .Include(l => l.PaymentSchedules)
            .FirstOrDefaultAsync(l => l.LeaseId == id);

        if (lease == null)
        {
            return NotFound(new { message = "Lease not found" });
        }

        if (lease.StartDate == null || lease.EndDate == null)
        {
            return BadRequest(new { message = "Lease start date and end date are required" });
        }

        if (lease.AnnualRate == null)
        {
            return BadRequest(new { message = "Lease annual rate is required" });
        }

        var result = _cashflowService.CalculateCashflowSchedule(lease, lease.PaymentSchedules.ToList());

        return Ok(new CashflowSummaryDto
        {
            AnnualRate = lease.AnnualRate.Value,
            Period = lease.NumberOfYears,
            Advance = lease.RentAdvance,
            AdvancePeriod = lease.RentAdvancePeriod,
            PaymentTiming = lease.IsPaymentAtBeginning ? "Beginning of Month" : "End of Month",
            Address = lease.LeasePropertyAddress,
            Totals = result.Totals
        });
    }

    // GET: api/leases/{id}/cashflow-year/{year}
    [HttpGet("{id}/cashflow-year/{year}")]
    public async Task<ActionResult<CashflowResponseDto>> GetPaymentCashflowsByYear(int id, int year)
    {
        if (year <= 0)
        {
            return BadRequest(new { message = "Year must be greater than 0" });
        }

        var lease = await _context.Leases
            .Include(l => l.PaymentSchedules)
            .FirstOrDefaultAsync(l => l.LeaseId == id);

        if (lease == null)
            return NotFound(new { message = "Lease not found" });

        if (lease.StartDate == null || lease.EndDate == null)
            return BadRequest(new { message = "Lease start date and end date are required" });

        if (lease.AnnualRate == null)
            return BadRequest(new { message = "Lease annual rate is required" });

        if (lease.NumberOfYears.GetValueOrDefault() < year)
        {
            return BadRequest(new { message = $"Lease only has {lease.NumberOfYears} years. Year {year} does not exist." });
        }

        var fullResult = _cashflowService.CalculateCashflowSchedule(lease, lease.PaymentSchedules.ToList());

        // Filter cashflows to only the requested year
        var filteredCashflows = fullResult.Cashflows
            .Where(cf => cf.LeaseYear == year)
            .ToList();

        // Recalculate totals for the filtered year
        var yearTotals = new CashflowTotalsDto
        {
            TotalGrossRent = Math.Round(filteredCashflows.Sum(cf => cf.GrossRent), 2),
            TotalRentAdvanceDeduction = Math.Round(filteredCashflows.Sum(cf => cf.RentAdvanceDeduction), 2),
            TotalNetCashFlow = Math.Round(filteredCashflows.Sum(cf => cf.NetCashFlow), 2),
            TotalPresentValue = Math.Round(filteredCashflows.Sum(cf => cf.PresentValue), 2)
        };

        return Ok(new CashflowResponseDto
        {
            Lease = fullResult.Lease,
            Assumptions = fullResult.Assumptions,
            Cashflows = filteredCashflows,
            Totals = yearTotals
        });
    }

    // GET: api/leases/lessor/{lessorId}
    [HttpGet("lessor/{lessorId}")]
    public async Task<ActionResult<IEnumerable<LeaseDto>>> GetLeasesByLessor(int lessorId)
    {
        var leases = await _context.Leases
            .Where(l => l.LessorId == lessorId)
            .Include(l => l.Branch)
            .Include(l => l.Lessor)
            .Include(l => l.PaymentSchedules)
            .ToListAsync();

        return Ok(leases.Select(MapToDto).ToList());
    }

    // POST: api/leases
    [HttpPost]
    [NotifyOnSuccess("Lease created", "Lease '{entityName}' was created by {userName} ({userRole}).", nameof(Lease), NotificationScenario.DirectCreate)]

    public async Task<ActionResult<LeaseDto>> CreateLease(Lease lease)
    {
        if (lease.BranchId != null && !await _context.Branches.AnyAsync(b => b.BranchId == lease.BranchId))
        {
            return BadRequest(new { message = "Invalid BranchId" });
        }

        if (lease.LessorId != null && !await _context.Lessors.AnyAsync(les => les.LessorId == lease.LessorId))
        {
            return BadRequest(new { message = "Invalid LessorId" });
        }

        if (lease.NumberOfYears.GetValueOrDefault() > 0)
        {
            if (lease.PaymentSchedules == null || lease.PaymentSchedules.Count != lease.NumberOfYears)
            {
                return BadRequest(new { message = "Payment schedules must match the number of years" });
            }

            if (lease.PaymentSchedules.Any(schedule => schedule.GrossAmount == null || schedule.GrossAmount < 0))
            {
                return BadRequest(new { message = "Gross amount must be non-negative" });
            }

            lease.PaymentSchedules = lease.PaymentSchedules
                .OrderBy(schedule => schedule.LeaseYear)
                .Select((schedule, index) =>
                {
                    var leaseYear = index + 1;
                    schedule.LeaseYear = leaseYear;
                    schedule.CreatedAt = DateTime.UtcNow;
                    schedule.UpdatedAt = DateTime.UtcNow;
                    return schedule;
                })
                .ToList();
        }

        lease.CreatedAt = DateTime.UtcNow;
        lease.UpdatedAt = DateTime.UtcNow;

        _context.Leases.Add(lease);
        await _context.SaveChangesAsync();

        // Reload with related data
        var createdLease = await _context.Leases
            .Include(l => l.Branch)
            .Include(l => l.Lessor)
            .Include(l => l.PaymentSchedules)
            .FirstOrDefaultAsync(l => l.LeaseId == lease.LeaseId);

        
        return CreatedAtAction(nameof(GetLease), new { id = lease.LeaseId }, MapToDto(createdLease!));
    }

    // PUT: api/leases/{id}
    [HttpPut("{id}")]
    [Authorize]
    [NotifyOnSuccess("Lease update submitted", "Lease update request submitted by {userName} ({userRole}).", nameof(EntityChangeRequest), NotificationScenario.SubmitForApproval)]

    public async Task<IActionResult> UpdateLease(int id, LeaseUpdateRequestDto request) 
    {
        if (id != request.LeaseId)
    {
        return BadRequest(new { message = "ID mismatch" });
    }

        var currentUserId = User.GetCurrentUserId();
        if (!currentUserId.HasValue)
    {
        return Unauthorized(new { message = "Invalid token." });
    }

        var existingLease = await _context.Leases.FindAsync(id);
        if (existingLease == null)
    {
        return NotFound(new { message = "Lease not found" });
    }

        // Validate Branch
        if (request.BranchId != null &&
        !await _context.Branches.AnyAsync(b => b.BranchId == request.BranchId))
    {
        return BadRequest(new { message = "Invalid BranchId" });
    }

        // Validate Lessor
        if (request.LessorId != null &&
        !await _context.Lessors.AnyAsync(l => l.LessorId == request.LessorId))
    {
        return BadRequest(new { message = "Invalid LessorId" });
    }

    // Prevent terminated lease from becoming active again
        if (
        IsTerminatedStatus(existingLease.LeaseStatus) &&
        IsActiveStatus(request.LeaseStatus)
    )
    {
        return BadRequest(new
        {
            message = "Terminated leases cannot be changed back to Active"
        });
    }

    // Submit update request to approval workflow
        var result = await _workflowService.SubmitLeaseUpdateAsync(
            currentUserId.Value,
            request
    );

        return StatusCode(result.StatusCode, new
        {
        message = result.Message,
        data = result.Data
        });
    }
    // DELETE: api/leases/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLease(int id)
    {
        var lease = await _context.Leases.FindAsync(id);
        if (lease == null)
        {
            return NotFound(new { message = "Lease not found" });
        }

        _context.Leases.Remove(lease);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Lease deleted successfully" });
    }
}
