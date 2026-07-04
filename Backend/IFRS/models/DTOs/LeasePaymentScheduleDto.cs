namespace IFRS.models.DTOs;

public class YearlyPaymentDto
{
    public int LeaseYear { get; set; }
    public decimal GrossAmount { get; set; }
}

public class BulkLeasePaymentScheduleDto
{
    public int LeaseId { get; set; }
    public List<YearlyPaymentDto> YearlyPayments { get; set; } = new();
}
