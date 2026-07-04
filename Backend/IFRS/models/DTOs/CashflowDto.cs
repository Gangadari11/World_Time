namespace IFRS.models.DTOs;

public class CashflowLeaseInfoDto
{
    public int LeaseId { get; set; }
    public string? LeaseNo { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public decimal? RentAdvance { get; set; }
    public int? RentAdvancePeriod { get; set; }
    public bool IsPaymentAtBeginning { get; set; }
}

public class CashflowAssumptionsDto
{
    public decimal InterestRate { get; set; }
}

public class CashflowRowDto
{
    public int MonthNumber { get; set; }
    public int LeaseYear { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public int Year { get; set; }
    public string DueDate { get; set; } = string.Empty;
    public decimal GrossRent { get; set; }
    public decimal RentAdvanceDeduction { get; set; }
    public decimal NetCashFlow { get; set; }
    public decimal DiscountFactor { get; set; }
    public decimal PresentValue { get; set; }
}

public class CashflowTotalsDto
{
    public decimal TotalGrossRent { get; set; }
    public decimal TotalRentAdvanceDeduction { get; set; }
    public decimal TotalNetCashFlow { get; set; }
    public decimal TotalPresentValue { get; set; }
}

public class CashflowSummaryDto
{
    public decimal AnnualRate { get; set; }
    public int? Period { get; set; }
    public decimal? Advance { get; set; }
    public int? AdvancePeriod { get; set; }
    public string PaymentTiming { get; set; } = string.Empty;
    public string? Address { get; set; }
    public CashflowTotalsDto Totals { get; set; } = new();
}

public class CashflowResponseDto
{
    public CashflowLeaseInfoDto Lease { get; set; } = new();
    public CashflowAssumptionsDto Assumptions { get; set; } = new();
    public List<CashflowRowDto> Cashflows { get; set; } = new();
    public CashflowTotalsDto Totals { get; set; } = new();
}
