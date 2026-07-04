using IFRS.models;
using IFRS.services;
using Xunit;

namespace IFRS.Tests.Services;

public class CashflowServiceTests
{
    [Fact]
    public void CalculateOutstandingReceivable_ReturnsRefundableDepositOnly_WhenTerminatedNaturally()
    {
        var service = new CashflowService();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var lease = new Lease
        {
            LeaseStatus = "Terminate",
            StartDate = new DateOnly(today.Year - 1, today.Month, 1),
            EndDate = today.AddMonths(60),
            RentAdvance = 1200000m,
            RentAdvancePeriod = 24,
            RefundableDeposit = 400000m
        };

        var result = service.CalculateOutstandingReceivable(lease);

        Assert.Equal(1000000m, result);
    }

    [Fact]
    public void CalculateOutstandingReceivable_ReturnsRefundableDepositPlusRemainingRentAdvance_WhenTerminatedDuringAdvancePeriod()
    {
        var service = new CashflowService();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var lease = new Lease
        {
            LeaseStatus = "Terminate",
            StartDate = new DateOnly(today.Year - 5, today.Month, 1),
            EndDate = today.AddMonths(1),
            RentAdvance = 1200000m,
            RentAdvancePeriod = 36,
            RefundableDeposit = 400000m
        };

        var result = service.CalculateOutstandingReceivable(lease);

        Assert.Equal(400000m, result);
    }

    [Fact]
    public void CalculateOutstandingReceivable_ReturnsRefundableDepositOnly_WhenTerminatedAfterAdvancePeriod()
    {
        var service = new CashflowService();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var lease = new Lease
        {
            LeaseStatus = "Terminate",
            StartDate = new DateOnly(today.Year - 4, today.Month, 1),
            EndDate = today.AddMonths(-1),
            RentAdvance = 1200000m,
            RentAdvancePeriod = 12,
            RefundableDeposit = 400000m
        };

        var result = service.CalculateOutstandingReceivable(lease);

        Assert.Equal(400000m, result);
    }

    [Fact]
    public void CalculateCashflowSchedule_BuildsMonthlyRowsFromYearlySchedules()
    {
        var service = new CashflowService();

        var lease = new Lease
        {
            LeaseId = 1,
            LeaseNo = "L-100",
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2030, 12, 31),
            AnnualRate = 12m,
            RentAdvance = 1200000m,
            RentAdvancePeriod = 36,
            RefundableDeposit = 400000m,
            NumberOfYears = 5
        };

        var schedules = new List<LeasePaymentSchedule>
        {
            new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 100000m },
            new LeasePaymentSchedule { LeaseYear = 2, GrossAmount = 100000m },
            new LeasePaymentSchedule { LeaseYear = 3, GrossAmount = 120000m },
            new LeasePaymentSchedule { LeaseYear = 4, GrossAmount = 120000m },
            new LeasePaymentSchedule { LeaseYear = 5, GrossAmount = 150000m }
        };

        var result = service.CalculateCashflowSchedule(lease, schedules);

        Assert.Equal(1, result.Lease.LeaseId);
        Assert.Equal("L-100", result.Lease.LeaseNo);
        Assert.Equal(0.12m, result.Assumptions.InterestRate);
        Assert.Equal(60, result.Cashflows.Count);
        Assert.Equal(7080000m, result.Totals.TotalGrossRent);
        Assert.Equal(1199999.88m, result.Totals.TotalRentAdvanceDeduction);
        Assert.Equal(5880000.12m, result.Totals.TotalNetCashFlow);

        var firstMonth = result.Cashflows[0];
        var month37 = result.Cashflows[36];

        Assert.Equal(1, firstMonth.MonthNumber);
        Assert.Equal(1, firstMonth.LeaseYear);
        Assert.Equal(100000m, firstMonth.GrossRent);
        Assert.Equal(33333.33m, firstMonth.RentAdvanceDeduction);
        Assert.Equal(66666.67m, firstMonth.NetCashFlow);

        Assert.Equal(37, month37.MonthNumber);
        Assert.Equal(4, month37.LeaseYear);
        Assert.Equal(120000m, month37.GrossRent);
        Assert.Equal(0m, month37.RentAdvanceDeduction);
        Assert.Equal(120000m, month37.NetCashFlow);
    }

    [Fact]
    public void CalculateCashflowSchedule_UsesLeaseTermYears_WhenLeaseStartsMidMonth()
    {
        var service = new CashflowService();

        var lease = new Lease
        {
            LeaseId = 1,
            LeaseNo = "L-200",
            StartDate = new DateOnly(2026, 1, 15),
            EndDate = new DateOnly(2031, 1, 14),
            AnnualRate = 12m,
            RentAdvance = 0m,
            RentAdvancePeriod = 0,
            NumberOfYears = 5
        };

        var schedules = new List<LeasePaymentSchedule>
        {
            new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 100000m },
            new LeasePaymentSchedule { LeaseYear = 2, GrossAmount = 100000m },
            new LeasePaymentSchedule { LeaseYear = 3, GrossAmount = 100000m },
            new LeasePaymentSchedule { LeaseYear = 4, GrossAmount = 100000m },
            new LeasePaymentSchedule { LeaseYear = 5, GrossAmount = 100000m }
        };

        var result = service.CalculateCashflowSchedule(lease, schedules);

        Assert.Equal(60, result.Cashflows.Count);
        Assert.Equal(1, result.Cashflows[0].MonthNumber);
        Assert.Equal(60, result.Cashflows[^1].MonthNumber);
        Assert.Equal(2030, result.Cashflows[^1].Year);
        Assert.Equal("December", result.Cashflows[^1].MonthName);
    }

    [Fact]
    public void CalculateCashflowSchedule_EndOfMonth_FirstMonthDiscountFactorIsLessThanOne()
    {
        var service = new CashflowService();

        var lease = new Lease
        {
            LeaseId = 1,
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            AnnualRate = 9.71m,
            IsPaymentAtBeginning = false
        };

        var schedules = new List<LeasePaymentSchedule>
        {
            new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 200000m }
        };

        var result = service.CalculateCashflowSchedule(lease, schedules);

        // monthly_rate = 9.71 / 100 / 12 = 0.00809167
        // month 1 discount_period = 1, factor = 1 / (1.00809167)^1 = 0.991973
        Assert.Equal(0.991973m, result.Cashflows[0].DiscountFactor);
    }

    [Fact]
    public void CalculateCashflowSchedule_BeginningOfMonth_FirstMonthDiscountFactorIsOne()
    {
        var service = new CashflowService();

        var lease = new Lease
        {
            LeaseId = 1,
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            AnnualRate = 9.71m,
            IsPaymentAtBeginning = true
        };

        var schedules = new List<LeasePaymentSchedule>
        {
            new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 200000m }
        };

        var result = service.CalculateCashflowSchedule(lease, schedules);

        // month 1 discount_period = 0, factor = 1 / (1.00809167)^0 = 1.000000
        Assert.Equal(1.000000m, result.Cashflows[0].DiscountFactor);
    }

    [Fact]
    public void CalculateCashflowSchedule_BeginningOfMonth_SecondMonthFactorEqualsEndOfMonthFirstMonthFactor()
    {
        var service = new CashflowService();

        var schedules = new List<LeasePaymentSchedule>
        {
            new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 200000m }
        };

        var endOfMonthLease = new Lease
        {
            LeaseId = 1,
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            AnnualRate = 9.71m,
            IsPaymentAtBeginning = false
        };

        var beginningOfMonthLease = new Lease
        {
            LeaseId = 1,
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            AnnualRate = 9.71m,
            IsPaymentAtBeginning = true
        };

        var endResult = service.CalculateCashflowSchedule(endOfMonthLease, schedules);
        var beginResult = service.CalculateCashflowSchedule(beginningOfMonthLease, schedules);

        // beginning month 2 discount_period = 1, same as end-of-month month 1 discount_period = 1
        Assert.Equal(endResult.Cashflows[0].DiscountFactor, beginResult.Cashflows[1].DiscountFactor);
    }

    [Fact]
    public void CalculateCashflowSchedule_BeginningOfMonth_TotalPresentValueIsGreaterThanEndOfMonth()
    {
        var service = new CashflowService();

        var schedules = new List<LeasePaymentSchedule>
        {
            new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 200000m },
            new LeasePaymentSchedule { LeaseYear = 2, GrossAmount = 200000m },
            new LeasePaymentSchedule { LeaseYear = 3, GrossAmount = 200000m },
            new LeasePaymentSchedule { LeaseYear = 4, GrossAmount = 200000m },
            new LeasePaymentSchedule { LeaseYear = 5, GrossAmount = 200000m }
        };

        var endOfMonthLease = new Lease
        {
            LeaseId = 1,
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2030, 12, 31),
            AnnualRate = 9.71m,
            RentAdvance = 0m,
            RentAdvancePeriod = 0,
            IsPaymentAtBeginning = false
        };

        var beginningOfMonthLease = new Lease
        {
            LeaseId = 2,
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2030, 12, 31),
            AnnualRate = 9.71m,
            RentAdvance = 0m,
            RentAdvancePeriod = 0,
            IsPaymentAtBeginning = true
        };

        var endResult = service.CalculateCashflowSchedule(endOfMonthLease, schedules);
        var beginResult = service.CalculateCashflowSchedule(beginningOfMonthLease, schedules);

        Assert.True(beginResult.Totals.TotalPresentValue > endResult.Totals.TotalPresentValue);
    }

    [Fact]
    public void CalculateCashflowSchedule_UsesMonthlyRate_NotAnnualRate()
    {
        var service = new CashflowService();

        var lease = new Lease
        {
            LeaseId = 1,
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            AnnualRate = 12m,
            IsPaymentAtBeginning = false
        };

        var schedules = new List<LeasePaymentSchedule>
        {
            new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 200000m }
        };

        var result = service.CalculateCashflowSchedule(lease, schedules);

        // monthly_rate = 12 / 100 / 12 = 0.01
        // correct:  1 / (1.01)^1  = 0.990099
        // incorrect: 1 / (1.12)^1 = 0.892857 (would be annual rate applied directly)
        Assert.Equal(0.990099m, result.Cashflows[0].DiscountFactor);
        Assert.NotEqual(0.892857m, result.Cashflows[0].DiscountFactor);
    }

    [Fact]
    public void CalculateCashflowSchedule_IsPaymentAtBeginning_IsReflectedInResponseDto()
    {
        var service = new CashflowService();

        var lease = new Lease
        {
            LeaseId = 1,
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            AnnualRate = 9.71m,
            IsPaymentAtBeginning = true
        };

        var schedules = new List<LeasePaymentSchedule>
        {
            new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 200000m }
        };

        var result = service.CalculateCashflowSchedule(lease, schedules);

        Assert.True(result.Lease.IsPaymentAtBeginning);
    }
}