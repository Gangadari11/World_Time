namespace IFRS.models.DTOs;

public class LeaseDto
{
    public int LeaseId { get; set; }
    public int? BranchId { get; set; }
    public int? LessorId { get; set; }
    public string? LeaseNo { get; set; }
    public string? LeasePropertyAddress { get; set; }
    public int? Sqft { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Extensions { get; set; }
    public int? NumberOfYears { get; set; }
    public string? RemainingPeriod { get; set; }
    public decimal? RentAdvance { get; set; }
    public int? RentAdvancePeriod { get; set; }
    public decimal? RefundableDeposit { get; set; }
    public int? NoticePeriodMonths { get; set; }
    public string? Remarks { get; set; }
    public decimal? AgreementValue { get; set; }
    public decimal? AnnualRate { get; set; }
    public string? LeaseStatus { get; set; }
    public bool IsPaymentAtBeginning { get; set; }
    public decimal? UtilityBill { get; set; }
    public decimal? WhtRate { get; set; }
    public decimal? VatRate { get; set; }
    public decimal? OutstandingReceivableFromLessor { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Non-circular navigation properties
    public LeaseBranchDto? Branch { get; set; }
    public LessorDto? Lessor { get; set; }
    public ICollection<LeasePaymentScheduleDto> PaymentSchedules { get; set; } = new List<LeasePaymentScheduleDto>();
}

public class LeaseBranchDto
{
    public int BranchId { get; set; }
    public string? OracleCode { get; set; }
    public string? BranchCode { get; set; }
    public string? BranchName { get; set; }
    public string? Lessee { get; set; }
    public string? Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Note: Not including Leases collection to avoid circular reference
}

public class LessorDto
{
    public int LessorId { get; set; }
    public string? FullName { get; set; }
    public string? Nic { get; set; }
    public string? Address { get; set; }
    public string? BankName { get; set; }
    public string? AccountNumber { get; set; }
    public string? BankCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class LessorDetailDto
{
    public int LessorId { get; set; }
    public string? FullName { get; set; }
    public string? Nic { get; set; }
    public string? Address { get; set; }
    public string? BankName { get; set; }
    public string? AccountNumber { get; set; }
    public string? BankCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ICollection<LeaseSimpleDto> Leases { get; set; } = new List<LeaseSimpleDto>();
}

public class LeasePaymentScheduleDto
{
    public int PaymentScheduleId { get; set; }
    public int? LeaseId { get; set; }
    public int? LeaseYear { get; set; }
    public decimal? GrossAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
public class Ifrs16ReportFilterDto
{
    public int? BranchId { get; set; }
    public string? LeaseStatus { get; set; }
    public DateOnly? StartDateFrom { get; set; }
    public DateOnly? StartDateTo { get; set; }
    public DateOnly? EndDateFrom { get; set; }
    public DateOnly? EndDateTo { get; set; }
}

public class Ifrs16LeaseIndentureSummaryRowDto
{
    public int LeaseId { get; set; }
    public string? OracleCode { get; set; }
    public string? BranchCode { get; set; }
    public string? BranchName { get; set; }
    public string? Lessee { get; set; }
    public string? LessorFullName { get; set; }
    public string? LeaseNo { get; set; }
    public string? Nic { get; set; }
    public string? LessorAddress { get; set; }
    public int? Sqft { get; set; }
    public string? LeasePropertyAddress { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Extensions { get; set; }
    public int? NumberOfYears { get; set; }
    public DateOnly Today { get; set; }
    public decimal? RemainingPeriodYears { get; set; }
    public decimal? FirstYearScheduledAmount { get; set; }
    public decimal? SecondYearScheduledAmount { get; set; }
    public decimal? ThirdYearScheduledAmount { get; set; }
    public decimal? FourthYearScheduledAmount { get; set; }
    public decimal? FifthYearScheduledAmount { get; set; }
    public decimal? SixthYearScheduledAmount { get; set; }
    public decimal? FirstYearActualAmount { get; set; }
    public decimal? SecondYearActualAmount { get; set; }
    public decimal? ThirdYearActualAmount { get; set; }
    public decimal? FourthYearActualAmount { get; set; }
    public decimal? FifthYearActualAmount { get; set; }
    public decimal? SixthYearActualAmount { get; set; }
    public string? AccountNumber { get; set; }
    public string? BankName { get; set; }
    public decimal? RentAdvance { get; set; }
    public decimal? RefundableDeposit { get; set; }
    public int? NoticePeriodMonths { get; set; }
    public string? Remarks { get; set; }
    public int? RentAdvancePeriod { get; set; }
    public decimal? RequiredDeductionFromMonthlyRental { get; set; }
    public decimal? AgreementValue { get; set; }
    public string? LeaseStatus { get; set; }
    // Termination / outstanding receivable fields
    public int? MonthsToRecoverRentAdvance { get; set; }
    public int? MonthsRecovered { get; set; }
    public int? BalanceMonthsToBeRecovered { get; set; }
    public decimal? RentAdvanceRecoveryPerMonth { get; set; }
    public decimal? TotalRentAdvanceRecovery { get; set; }
    public decimal? TotalOutstandingReceivable { get; set; }
}

public class LeaseSimpleDto
{
    public int LeaseId { get; set; }
    public int? BranchId { get; set; }
    public int? LessorId { get; set; }
    public string? LeaseNo { get; set; }
    public string? LeasePropertyAddress { get; set; }
    public int? Sqft { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Extensions { get; set; }
    public int? NumberOfYears { get; set; }
    public string? RemainingPeriod { get; set; }
    public decimal? RentAdvance { get; set; }
    public int? RentAdvancePeriod { get; set; }
    public decimal? RefundableDeposit { get; set; }
    public int? NoticePeriodMonths { get; set; }
    public string? Remarks { get; set; }
    public decimal? AgreementValue { get; set; }
    public decimal? AnnualRate { get; set; }
    public string? LeaseStatus { get; set; }
    public bool IsPaymentAtBeginning { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}