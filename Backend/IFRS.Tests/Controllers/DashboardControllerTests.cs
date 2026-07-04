using IFRS.controllers;
using IFRS.models;
using IFRS.Tests.TestHelpers;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Xunit;

namespace IFRS.Tests.Controllers;

public class DashboardControllerTests
{
    [Fact]
    public async Task Summary_ReturnsExpectedActiveLeaseTotals()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        await SeedDashboardData(db);

        var controller = new DashboardController(db);

        var result = await controller.Summary();
        var ok = Assert.IsType<OkObjectResult>(result);

        var payload = Deserialize<DashboardSummaryDto>(ok.Value!);
        Assert.Equal(4, payload.TotalActiveLeases);
        Assert.Equal(4000m, payload.TotalAgreementValue);
        Assert.Equal(5m, payload.AverageRentPerSqft);
    }

    [Fact]
    public async Task RemainingTermDistribution_ReturnsExpectedBuckets()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        await SeedDashboardData(db);

        var controller = new DashboardController(db);

        var result = await controller.RemainingTermDistribution();
        var ok = Assert.IsType<OkObjectResult>(result);

        var buckets = Assert.IsType<Dictionary<string, int>>(ok.Value);
        Assert.Equal(2, buckets["0-1"]);
        Assert.Equal(0, buckets["1-3"]);
        Assert.Equal(1, buckets["3-5"]);
        Assert.Equal(1, buckets["5+"]);
    }

    [Fact]
    public async Task UpcomingExpirations_ReturnsExpectedWindowCounts()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        await SeedDashboardData(db);

        var controller = new DashboardController(db);

        var result = await controller.UpcomingExpirations();
        var ok = Assert.IsType<OkObjectResult>(result);

        var payload = Deserialize<UpcomingExpirationsDto>(ok.Value!);
        Assert.Equal(1, payload.Count30);
        Assert.Equal(2, payload.Count90);
        Assert.Equal(2, payload.Count365);
        Assert.Equal(2, payload.Items.Count);
    }

    [Fact]
    public async Task TopLessors_ReturnsSortedByAgreementValue()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        await SeedDashboardData(db);

        var controller = new DashboardController(db);

        var result = await controller.TopLessors(5);
        var ok = Assert.IsType<OkObjectResult>(result);

        var payload = Deserialize<List<TopLessorDto>>(ok.Value!);

        Assert.NotEmpty(payload);
        Assert.Equal("Lessor One", payload[0].Lessor);
        Assert.True(payload[0].TotalAgreementValue >= payload[1].TotalAgreementValue);
    }

    [Fact]
    public async Task BranchSummary_ReturnsPerBranchMetrics()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        await SeedDashboardData(db);

        var controller = new DashboardController(db);

        var result = await controller.BranchSummary();
        var ok = Assert.IsType<OkObjectResult>(result);

        var payload = Deserialize<List<BranchSummaryDto>>(ok.Value!);
        var branchA = payload.Single(x => x.OracleCode == "B001");

        Assert.Equal(2, branchA.LeasesCount);
        Assert.Equal(2000m, branchA.AgreementSum);
        Assert.True(branchA.MonthlyExpected > 0);
        Assert.True(branchA.Overdue >= 0);
    }

    private static async Task SeedDashboardData(IFRS.Data.IFRSDbContext db)
    {
        var branch1 = new Branch { OracleCode = "B001", BranchName = "Branch 1", Lessee = "Lessee 1", Status = "active" };
        var branch2 = new Branch { OracleCode = "B002", BranchName = "Branch 2", Lessee = "Lessee 2", Status = "active" };
        var lessor1 = new Lessor { FullName = "Lessor One", Nic = "111", Address = "Addr1", BankName = "Bank", AccountNumber = "001" };
        var lessor2 = new Lessor { FullName = "Lessor Two", Nic = "222", Address = "Addr2", BankName = "Bank", AccountNumber = "002" };

        db.Branches.AddRange(branch1, branch2);
        db.Lessors.AddRange(lessor1, lessor2);
        await db.SaveChangesAsync();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var leaseA = new Lease
        {
            BranchId = branch1.BranchId,
            LessorId = lessor1.LessorId,
            LeaseNo = "L-A",
            StartDate = today.AddYears(-1),
            EndDate = today.AddDays(20),
            NumberOfYears = 2,
            AgreementValue = 1000m,
            Sqft = 200,
            LeaseStatus = "Active",
            PaymentSchedules = new List<LeasePaymentSchedule>
            {
                new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 100m },
                new LeasePaymentSchedule { LeaseYear = 2, GrossAmount = 100m }
            }
        };

        var leaseB = new Lease
        {
            BranchId = branch1.BranchId,
            LessorId = lessor2.LessorId,
            LeaseNo = "L-B",
            StartDate = today.AddYears(-1),
            EndDate = today.AddDays(60),
            NumberOfYears = 2,
            AgreementValue = 1000m,
            Sqft = 200,
            LeaseStatus = "Active",
            PaymentSchedules = new List<LeasePaymentSchedule>
            {
                new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 120m }
            }
        };

        var leaseC = new Lease
        {
            BranchId = branch2.BranchId,
            LessorId = lessor1.LessorId,
            LeaseNo = "L-C",
            StartDate = today,
            EndDate = today.AddYears(4),
            NumberOfYears = 4,
            AgreementValue = 1000m,
            Sqft = 200,
            LeaseStatus = "Active"
        };

        var leaseD = new Lease
        {
            BranchId = branch2.BranchId,
            LessorId = lessor1.LessorId,
            LeaseNo = "L-D",
            StartDate = today,
            EndDate = today.AddYears(7),
            NumberOfYears = 7,
            AgreementValue = 1000m,
            Sqft = 200,
            LeaseStatus = "Active"
        };

        var leaseOutsideWindow = new Lease
        {
            BranchId = branch2.BranchId,
            LessorId = lessor2.LessorId,
            LeaseNo = "L-E",
            StartDate = today,
            EndDate = today.AddDays(500),
            NumberOfYears = 2,
            AgreementValue = 900m,
            Sqft = 100,
            LeaseStatus = "Terminate"
        };

        db.Leases.AddRange(leaseA, leaseB, leaseC, leaseD, leaseOutsideWindow);
        await db.SaveChangesAsync();
    }

    private static T Deserialize<T>(object value)
    {
        var json = JsonSerializer.Serialize(value);
        return JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
    }

    private sealed class DashboardSummaryDto
    {
        public int TotalActiveLeases { get; set; }
        public decimal TotalAgreementValue { get; set; }
        public decimal AverageRentPerSqft { get; set; }
    }

    private sealed class UpcomingExpirationsDto
    {
        public int Count30 { get; set; }
        public int Count90 { get; set; }
        public int Count365 { get; set; }
        public List<UpcomingLeaseDto> Items { get; set; } = new();
    }

    private sealed class UpcomingLeaseDto
    {
        public int LeaseId { get; set; }
        public string? LeaseNo { get; set; }
        public string? EndDate { get; set; }
    }

    private sealed class TopLessorDto
    {
        public string? Lessor { get; set; }
        public decimal TotalAgreementValue { get; set; }
    }

    private sealed class BranchSummaryDto
    {
        public int BranchId { get; set; }
        public string? OracleCode { get; set; }
        public string? BranchName { get; set; }
        public int LeasesCount { get; set; }
        public decimal AgreementSum { get; set; }
        public decimal MonthlyExpected { get; set; }
        public decimal Overdue { get; set; }
    }
}
