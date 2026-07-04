using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using IFRS.Data;
using IFRS.models;

namespace IFRS.controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IFRSDbContext _context;

    public DashboardController(IFRSDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var activeLeases = await _context.Leases
            .Where(l => l.LeaseStatus == "Active")
            .ToListAsync();

        var totalActiveLeases = activeLeases.Count;
        var totalAgreementValue = Math.Round(activeLeases.Sum(l => l.AgreementValue ?? 0m), 2);

        var rentPerSqftValues = activeLeases
            .Where(l => l.Sqft.HasValue && l.Sqft > 0 && l.AgreementValue.HasValue)
            .Select(l => l.AgreementValue!.Value / l.Sqft!.Value)
            .ToList();

        var averageRentPerSqft = rentPerSqftValues.Any() ? Math.Round(rentPerSqftValues.Average(), 2) : 0m;

        return Ok(new
        {
            totalActiveLeases,
            totalAgreementValue,
            averageRentPerSqft
        });
    }

    [HttpGet("remaining-term-distribution")]
    public async Task<IActionResult> RemainingTermDistribution()
    {
        var today = DateTime.UtcNow;

        var leases = await _context.Leases
            .Where(l => l.EndDate != null && l.LeaseStatus == "Active")
            .Select(l => new { l.LeaseId, l.EndDate })
            .ToListAsync();

        var buckets = new Dictionary<string, int>
        {
            ["0-1"] = 0,
            ["1-3"] = 0,
            ["3-5"] = 0,
            ["5+"] = 0
        };

        foreach (var l in leases)
        {
            if (!l.EndDate.HasValue) continue;

            var remainingDays = (l.EndDate.Value.ToDateTime(new TimeOnly(0, 0)) - today).TotalDays;
            if (remainingDays < 0)
            {
                // expired - count in 0-1
                buckets["0-1"]++;
                continue;
            }

            var years = remainingDays / 365.25;
            if (years <= 1) buckets["0-1"]++;
            else if (years <= 3) buckets["1-3"]++;
            else if (years <= 5) buckets["3-5"]++;
            else buckets["5+"]++;
        }

        return Ok(buckets);
    }

    [HttpGet("upcoming-expirations")]
    public async Task<IActionResult> UpcomingExpirations()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var leases = await _context.Leases
            .Include(l => l.Branch)
            .Where(l => l.EndDate != null)
            .ToListAsync();

        var list = leases
            .Where(l => l.EndDate.HasValue && l.EndDate.Value >= today && l.EndDate.Value <= today.AddYears(1))
            .Select(l => new
            {
                l.LeaseId,
                l.LeaseNo,
                Branch = l.Branch != null ? new { l.Branch.BranchId, l.Branch.OracleCode, l.Branch.BranchName } : null,
                EndDate = l.EndDate?.ToString("yyyy-MM-dd")
            })
            .OrderBy(l => l.EndDate)
            .ToList();

        var count30 = list.Count(l => DateOnly.Parse(l.EndDate!) <= today.AddDays(30));
        var count90 = list.Count(l => DateOnly.Parse(l.EndDate!) <= today.AddDays(90));
        var count365 = list.Count;

        return Ok(new { count30, count90, count365, items = list });
    }

    [HttpGet("top-lessors")]
    public async Task<IActionResult> TopLessors(int top = 10)
    {
        var q = await _context.Leases
            .Where(l => l.LessorId != null && l.AgreementValue != null)
            .GroupBy(l => l.LessorId)
            .Select(g => new { LessorId = g.Key, Total = g.Sum(x => x.AgreementValue ?? 0m) })
            .OrderByDescending(x => x.Total)
            .Take(top)
            .ToListAsync();

        var lessorIds = q.Select(x => x.LessorId).ToList();

        var lessors = await _context.Lessors
            .Where(l => lessorIds.Contains(l.LessorId))
            .ToListAsync();

        var result = q.Select(x => new
        {
            lessor = lessors.FirstOrDefault(l => l.LessorId == x.LessorId)?.FullName ?? "(unknown)",
            totalAgreementValue = Math.Round(x.Total, 2)
        }).ToList();

        return Ok(result);
    }

    [HttpGet("branch-summary")]
    public async Task<IActionResult> BranchSummary()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var branches = await _context.Branches
            .Include(b => b.Leases)
                .ThenInclude(l => l.PaymentSchedules)
            .ToListAsync();

        var result = new List<object>();

        foreach (var b in branches)
        {
            var leases = b.Leases ?? new List<Lease>();
            var leasesCount = leases.Count;
            var agreementSum = Math.Round(leases.Sum(l => l.AgreementValue ?? 0m), 2);

            decimal monthlyExpected = 0m;
            decimal overdue = 0m;

            foreach (var l in leases)
            {
                if (l.AgreementValue.HasValue && l.NumberOfYears.HasValue && l.NumberOfYears > 0)
                {
                    monthlyExpected += l.AgreementValue.Value / (l.NumberOfYears.Value * 12m);
                }
            }

            result.Add(new
            {
                branchId = b.BranchId,
                oracleCode = b.OracleCode,
                branchName = b.BranchName,
                leasesCount,
                agreementSum = Math.Round(agreementSum, 2),
                monthlyExpected = Math.Round(monthlyExpected, 2),
                overdue = Math.Round(overdue, 2)
            });
        }

        return Ok(result);
    }

    private static int CalculateElapsedMonths(DateOnly startDate, DateOnly referenceDate)
    {
        if (referenceDate <= startDate) return 0;
        var months = (referenceDate.Year - startDate.Year) * 12 + (referenceDate.Month - startDate.Month);
        if (referenceDate.Day < startDate.Day) months--;
        return Math.Max(months, 0);
    }
}
