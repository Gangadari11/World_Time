using IFRS.controllers;
using IFRS.models;
using IFRS.models.DTOs;
using IFRS.services;
using IFRS.Tests.TestHelpers;
using Microsoft.AspNetCore.Mvc;
using Xunit;


namespace IFRS.Tests.Controllers;

public class LeasesIfrs16ReportingTests
{
    [Fact]
    public async Task Ifrs16Report_MapsLeaseYearColumnsCorrectly()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        var controller = new LeasesController(db, new CashflowService(), new EntityChangeRequestService(db));

        var lease = await SeedLeaseWithSchedules(db, leaseStatus: "Active");

        var action = await controller.GetIfrs16LeaseIndentureSummaryReport(new Ifrs16ReportFilterDto());
        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var rows = Assert.IsAssignableFrom<IEnumerable<Ifrs16LeaseIndentureSummaryRowDto>>(ok.Value);
        var row = Assert.Single(rows);

        Assert.Equal(lease.LeaseId, row.LeaseId);
        Assert.Equal(1000m, row.FirstYearScheduledAmount);
        Assert.Equal(2000m, row.SecondYearScheduledAmount);
        Assert.Equal(3000m, row.ThirdYearScheduledAmount);
        Assert.Null(row.FourthYearScheduledAmount);
        Assert.Null(row.FifthYearScheduledAmount);
        Assert.Null(row.SixthYearScheduledAmount);

        Assert.Equal(1000m, row.FirstYearActualAmount);
        Assert.Equal(2000m, row.SecondYearActualAmount);
        Assert.Equal(3000m, row.ThirdYearActualAmount);

        Assert.Equal(100m, row.RequiredDeductionFromMonthlyRental);
    }

    [Fact]
    public async Task Ifrs16Report_AppliesLeaseStatusFilter()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        var controller = new LeasesController(db, new CashflowService(), new EntityChangeRequestService(db));

        await SeedLeaseWithSchedules(db, leaseStatus: "Active", leaseNo: "L-A");
        await SeedLeaseWithSchedules(db, leaseStatus: "Terminate", leaseNo: "L-T");

        var action = await controller.GetIfrs16LeaseIndentureSummaryReport(new Ifrs16ReportFilterDto
        {
            LeaseStatus = "Terminate"
        });

        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var rows = Assert.IsAssignableFrom<IEnumerable<Ifrs16LeaseIndentureSummaryRowDto>>(ok.Value).ToList();

        Assert.Single(rows);
        Assert.Equal("Terminate", rows[0].LeaseStatus);
        Assert.Equal("L-T", rows[0].LeaseNo);
    }

    private static async Task<Lease> SeedLeaseWithSchedules(
        IFRS.Data.IFRSDbContext db,
        string leaseStatus,
        string leaseNo = "LEASE-001")
    {
        var branch = new Branch
        {
            OracleCode = "ORC-001",
            BranchName = "Main Branch",
            Lessee = "Lessee A",
            Status = "active"
        };

        var lessor = new Lessor
        {
            FullName = "Lessor A",
            Nic = "123456789V",
            Address = "Address",
            BankName = "Bank",
            AccountNumber = "111222333"
        };

        db.Branches.Add(branch);
        db.Lessors.Add(lessor);
        await db.SaveChangesAsync();

        var lease = new Lease
        {
            BranchId = branch.BranchId,
            LessorId = lessor.LessorId,
            LeaseNo = leaseNo,
            LeasePropertyAddress = "Address 123",
            Sqft = 500,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-1)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(2)),
            NumberOfYears = 3,
            RentAdvance = 1200m,
            RentAdvancePeriod = 12,
            RefundableDeposit = 500m,
            NoticePeriodMonths = 3,
            Remarks = "sample",
            AgreementValue = 6000m,
            AnnualRate = 10m,
            UtilityBill = 500m,
            WhtRate = 10m,
            VatRate = 15m,
            LeaseStatus = leaseStatus,
            PaymentSchedules = new List<LeasePaymentSchedule>
            {
                new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 1000m },
                new LeasePaymentSchedule { LeaseYear = 2, GrossAmount = 2000m },
                new LeasePaymentSchedule { LeaseYear = 3, GrossAmount = 3000m }
            }
        };

        db.Leases.Add(lease);
        await db.SaveChangesAsync();
        return lease;
    }
}
