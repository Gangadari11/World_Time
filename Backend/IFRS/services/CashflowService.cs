using IFRS.models;
using IFRS.models.DTOs;

namespace IFRS.services;

public class CashflowService
{
    public decimal? CalculateOutstandingReceivable(Lease lease)
    {
        if (!IsTerminated(lease.LeaseStatus))
        {
            return null;
        }

        var refundableDeposit = lease.RefundableDeposit.GetValueOrDefault();
        var remainingRentAdvance = CalculateRemainingRentAdvanceBalance(lease);

        return Math.Round(refundableDeposit + remainingRentAdvance, 2);
    }

    public CashflowResponseDto CalculateCashflowSchedule(Lease lease, List<LeasePaymentSchedule> schedules)
    {
        var interestRate = lease.AnnualRate!.Value / 100m;
        var totalMonths = lease.NumberOfYears.HasValue && lease.NumberOfYears.Value > 0
            ? lease.NumberOfYears.Value * 12
            : CalculateElapsedMonths(lease.StartDate!.Value, lease.EndDate!.Value) + 1;

        var months = GenerateLeaseMonths(lease.StartDate!.Value, totalMonths);

        var cashflows = new List<CashflowRowDto>();

        foreach (var (monthNumber, monthDate) in months)
        {
            var leaseYear = GetLeaseYear(monthNumber);
            var grossRent = GetGrossRentForLeaseYear(schedules, leaseYear);
            var rentAdvanceDeduction = CalculateRentAdvanceDeduction(lease.RentAdvance, lease.RentAdvancePeriod, monthNumber);
            var netCashFlow = Math.Round(grossRent - rentAdvanceDeduction, 2);
            var discountFactor = CalculateDiscountFactor(interestRate, monthNumber, lease.IsPaymentAtBeginning);
            var presentValue = CalculatePresentValue(netCashFlow, discountFactor);

            var dueDate = new DateOnly(monthDate.Year, monthDate.Month, DateTime.DaysInMonth(monthDate.Year, monthDate.Month));

            cashflows.Add(new CashflowRowDto
            {
                MonthNumber = monthNumber,
                LeaseYear = leaseYear,
                MonthName = monthDate.ToString("MMMM"),
                Year = monthDate.Year,
                DueDate = dueDate.ToString("yyyy-MM-dd"),
                GrossRent = grossRent,
                RentAdvanceDeduction = rentAdvanceDeduction,
                NetCashFlow = netCashFlow,
                DiscountFactor = discountFactor,
                PresentValue = presentValue
            });
        }

        return new CashflowResponseDto
        {
            Lease = new CashflowLeaseInfoDto
            {
                LeaseId = lease.LeaseId,
                LeaseNo = lease.LeaseNo,
                StartDate = lease.StartDate,
                EndDate = lease.EndDate,
                RentAdvance = lease.RentAdvance,
                RentAdvancePeriod = lease.RentAdvancePeriod,
                IsPaymentAtBeginning = lease.IsPaymentAtBeginning
            },
            Assumptions = new CashflowAssumptionsDto
            {
                InterestRate = interestRate
            },
            Cashflows = cashflows,
            Totals = new CashflowTotalsDto
            {
                TotalGrossRent = Math.Round(cashflows.Sum(c => c.GrossRent), 2),
                TotalRentAdvanceDeduction = Math.Round(cashflows.Sum(c => c.RentAdvanceDeduction), 2),
                TotalNetCashFlow = Math.Round(cashflows.Sum(c => c.NetCashFlow), 2),
                TotalPresentValue = Math.Round(cashflows.Sum(c => c.PresentValue), 2)
            }
        };
    }

    private static List<(int monthNumber, DateOnly date)> GenerateLeaseMonths(DateOnly startDate, int totalMonths)
    {
        var months = new List<(int, DateOnly)>(Math.Max(totalMonths, 0));
        var current = new DateOnly(startDate.Year, startDate.Month, 1);

        for (var monthNumber = 1; monthNumber <= totalMonths; monthNumber++)
        {
            months.Add((monthNumber, current));
            current = current.AddMonths(1);
        }

        return months;
    }

    private static int GetLeaseYear(int monthNumber) =>
        (int)Math.Ceiling(monthNumber / 12.0);

    private static decimal GetGrossRentForLeaseYear(List<LeasePaymentSchedule> schedules, int leaseYear)
    {
        var match = schedules.FirstOrDefault(s => s.LeaseYear == leaseYear);
        if (match != null)
            return match.GrossAmount ?? 0m;

        var fallback = schedules
            .Where(s => s.LeaseYear.HasValue)
            .OrderByDescending(s => s.LeaseYear)
            .FirstOrDefault();

        return fallback?.GrossAmount ?? 0m;
    }

    private static decimal CalculateRentAdvanceDeduction(decimal? rentAdvance, int? rentAdvancePeriod, int monthNumber)
    {
        if (rentAdvance == null || rentAdvancePeriod == null || rentAdvancePeriod == 0)
            return 0m;

        if (monthNumber <= rentAdvancePeriod)
            return Math.Round(rentAdvance.Value / rentAdvancePeriod.Value, 2);

        return 0m;
    }

    private static decimal CalculateDiscountFactor(decimal interestRate, int monthNumber, bool isPaymentAtBeginning)
    {
        var monthlyRate = interestRate / 12m;
        var discountPeriod = isPaymentAtBeginning ? monthNumber - 1 : monthNumber;
        return Math.Round((decimal)(1 / Math.Pow(1 + (double)monthlyRate, discountPeriod)), 6);
    }

    private static decimal CalculatePresentValue(decimal netCashFlow, decimal discountFactor) =>
        Math.Round(netCashFlow * discountFactor, 2);

    private static bool IsTerminated(string? leaseStatus) =>
        string.Equals(leaseStatus, "Terminate", StringComparison.OrdinalIgnoreCase);

    public static decimal CalculateRemainingRentAdvanceBalance(Lease lease)
    {
        if (lease.RentAdvance is null || lease.RentAdvancePeriod is null || lease.RentAdvancePeriod <= 0)
        {
            return 0m;
        }

        if (lease.StartDate is null)
        {
            return 0m;
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var referenceDate = lease.EndDate.HasValue && lease.EndDate.Value < today
            ? lease.EndDate.Value
            : today;

        var elapsedMonths = CalculateElapsedMonths(lease.StartDate.Value, referenceDate);
        var usedMonths = Math.Min(elapsedMonths, lease.RentAdvancePeriod.Value);
        var remainingMonths = lease.RentAdvancePeriod.Value - usedMonths;

        if (remainingMonths <= 0)
        {
            return 0m;
        }

        var monthlyAdvance = lease.RentAdvance.Value / lease.RentAdvancePeriod.Value;
        return Math.Round(monthlyAdvance * remainingMonths, 2);
    }

    public static int CalculateElapsedMonths(DateOnly startDate, DateOnly endDate)
    {
        if (endDate <= startDate)
        {
            return 0;
        }

        var months = (endDate.Year - startDate.Year) * 12 + (endDate.Month - startDate.Month);
        if (endDate.Day < startDate.Day)
        {
            months--;
        }

        return Math.Max(months, 0);
    }
}
