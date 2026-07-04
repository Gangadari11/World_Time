using System.Net;
using System.Net.Http.Json;
using IFRS.Data;
using IFRS.models;
using IFRS.models.DTOs;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace IFRS.Tests.Integration;

public class ReportingAndDashboardIntegrationTests : IClassFixture<IFRS.Tests.Infrastructure.CustomWebApplicationFactory>
{
    private static readonly InMemoryDatabaseRoot DatabaseRoot = new();
    private readonly IFRS.Tests.Infrastructure.CustomWebApplicationFactory _factory;

    public ReportingAndDashboardIntegrationTests(IFRS.Tests.Infrastructure.CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Dashboard_And_Ifrs16Report_Endpoints_ReturnExpectedResponses()
    {
        var clientFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("IntegrationTesting");
            builder.ConfigureServices(services =>
            {
                var descriptors = services
                    .Where(d => d.ServiceType == typeof(DbContextOptions<IFRSDbContext>) || d.ServiceType == typeof(IFRSDbContext))
                    .ToList();

                foreach (var descriptor in descriptors)
                {
                    services.Remove(descriptor);
                }

                var databaseName = $"reporting-dashboard-{Guid.NewGuid()}";
                services.AddDbContext<IFRSDbContext>(options => options.UseInMemoryDatabase(databaseName, DatabaseRoot));
            });
        });

        var client = clientFactory.CreateClient();

        using (var scope = clientFactory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IFRSDbContext>();
            await SeedData(db);
        }

        var summaryResp = await client.GetAsync("/api/dashboard/summary");
        await EnsureSuccess(summaryResp, HttpStatusCode.OK);

        var summary = await summaryResp.Content.ReadFromJsonAsync<DashboardSummaryDto>();
        Assert.NotNull(summary);
        Assert.Equal(2, summary!.TotalActiveLeases);
        Assert.Equal(7000m, summary.TotalAgreementValue);

        var topLessorsResp = await client.GetAsync("/api/dashboard/top-lessors?top=5");
        await EnsureSuccess(topLessorsResp, HttpStatusCode.OK);
        var lessors = await topLessorsResp.Content.ReadFromJsonAsync<List<TopLessorDto>>();
        Assert.NotNull(lessors);
        Assert.NotEmpty(lessors!);

        var branchSummaryResp = await client.GetAsync("/api/dashboard/branch-summary");
        await EnsureSuccess(branchSummaryResp, HttpStatusCode.OK);
        var branchSummary = await branchSummaryResp.Content.ReadFromJsonAsync<List<BranchSummaryDto>>();
        Assert.NotNull(branchSummary);
        Assert.NotEmpty(branchSummary!);

        var reportResp = await client.GetAsync("/api/leases/ifrs16-report?leaseStatus=Active");
        await EnsureSuccess(reportResp, HttpStatusCode.OK);

        var reportRows = await reportResp.Content.ReadFromJsonAsync<List<Ifrs16LeaseIndentureSummaryRowDto>>();
        Assert.NotNull(reportRows);
        Assert.NotEmpty(reportRows!);

        var first = reportRows![0];
        Assert.Equal("Active", first.LeaseStatus);
        Assert.Equal(1500m, first.FirstYearScheduledAmount);
        Assert.Equal(1500m, first.FirstYearActualAmount);
    }

    private static async Task SeedData(IFRSDbContext db)
    {
        var branch = new Branch
        {
            BranchName = "Integration Branch",
            OracleCode = "INT-RD-001",
            Lessee = "Integration Lessee",
            Status = "active"
        };

        var lessor1 = new Lessor
        {
            FullName = "Integration Lessor A",
            Nic = "100000001V",
            Address = "Address A",
            BankName = "Bank A",
            AccountNumber = "1001"
        };

        var lessor2 = new Lessor
        {
            FullName = "Integration Lessor B",
            Nic = "100000002V",
            Address = "Address B",
            BankName = "Bank B",
            AccountNumber = "1002"
        };

        db.Branches.Add(branch);
        db.Lessors.AddRange(lessor1, lessor2);
        await db.SaveChangesAsync();

        var activeLease = new Lease
        {
            BranchId = branch.BranchId,
            LessorId = lessor1.LessorId,
            LeaseNo = "RD-LEASE-A",
            LeasePropertyAddress = "Address 1",
            Sqft = 1000,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-1)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(2)),
            NumberOfYears = 2,
            RentAdvance = 1200m,
            RentAdvancePeriod = 12,
            AgreementValue = 4000m,
            AnnualRate = 10m,
            LeaseStatus = "Active",
            PaymentSchedules = new List<LeasePaymentSchedule>
            {
                new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 1500m },
                new LeasePaymentSchedule { LeaseYear = 2, GrossAmount = 2500m }
            }
        };

        var secondActiveLease = new Lease
        {
            BranchId = branch.BranchId,
            LessorId = lessor2.LessorId,
            LeaseNo = "RD-LEASE-B",
            LeasePropertyAddress = "Address 2",
            Sqft = 500,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-6)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(6)),
            NumberOfYears = 1,
            AgreementValue = 3000m,
            AnnualRate = 9m,
            LeaseStatus = "Active",
            PaymentSchedules = new List<LeasePaymentSchedule>
            {
                new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 3000m }
            }
        };

        var terminatedLease = new Lease
        {
            BranchId = branch.BranchId,
            LessorId = lessor1.LessorId,
            LeaseNo = "RD-LEASE-T",
            LeasePropertyAddress = "Address 3",
            Sqft = 600,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-2)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1)),
            NumberOfYears = 2,
            AgreementValue = 1500m,
            AnnualRate = 8m,
            LeaseStatus = "Terminate"
        };

        db.Leases.AddRange(activeLease, secondActiveLease, terminatedLease);
        await db.SaveChangesAsync();
    }

    private static async Task EnsureSuccess(HttpResponseMessage resp, HttpStatusCode expected)
    {
        if (resp.StatusCode != expected)
        {
            var text = await resp.Content.ReadAsStringAsync();
            Assert.Fail($"Expected {(int)expected} but got {(int)resp.StatusCode}. Body:\n{text}");
        }
    }

    private sealed class DashboardSummaryDto
    {
        public int TotalActiveLeases { get; set; }
        public decimal TotalAgreementValue { get; set; }
        public decimal AverageRentPerSqft { get; set; }
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
