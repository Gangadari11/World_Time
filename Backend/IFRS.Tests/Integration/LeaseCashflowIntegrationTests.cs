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

public class LeaseCashflowIntegrationTests : IClassFixture<IFRS.Tests.Infrastructure.CustomWebApplicationFactory>
{
    private static readonly InMemoryDatabaseRoot DatabaseRoot = new();
    private readonly IFRS.Tests.Infrastructure.CustomWebApplicationFactory _factory;

    public LeaseCashflowIntegrationTests(IFRS.Tests.Infrastructure.CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetPaymentCashflows_ReturnsCashflowSchedule_ForLeaseWithYearlyPaymentSchedules()
    {
        var clientFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("IntegrationTesting");
            builder.ConfigureServices(services =>
            {
                var descriptors = services.Where(d => d.ServiceType == typeof(DbContextOptions<IFRSDbContext>) || d.ServiceType == typeof(IFRSDbContext)).ToList();
                foreach (var descriptor in descriptors)
                {
                    services.Remove(descriptor);
                }

                var databaseName = $"cashflow-{Guid.NewGuid()}";
                services.AddDbContext<IFRSDbContext>(options => options.UseInMemoryDatabase(databaseName, DatabaseRoot));
            });
        });

        var client = clientFactory.CreateClient();

        int leaseId;
        using (var scope = clientFactory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IFRSDbContext>();

            var branch = new Branch
            {
                BranchName = "Cashflow Branch",
                OracleCode = "CF001",
                Lessee = "Cashflow Lessee",
                Status = "active"
            };

            var lessor = new Lessor
            {
                FullName = "Cashflow Lessor",
                Nic = "999999999V",
                Address = "Cashflow Address",
                BankName = "Test Bank",
                AccountNumber = "123456"
            };

            db.Branches.Add(branch);
            db.Lessors.Add(lessor);
            await db.SaveChangesAsync();

            var lease = new Lease
            {
                BranchId = branch.BranchId,
                LessorId = lessor.LessorId,
                LeaseNo = "CF-100",
                LeasePropertyAddress = "123 Cashflow Street",
                Sqft = 1500,
                StartDate = new DateOnly(2026, 1, 1),
                EndDate = new DateOnly(2030, 12, 31),
                NumberOfYears = 5,
                RentAdvance = 1200000m,
                RentAdvancePeriod = 36,
                RefundableDeposit = 400000m,
                AnnualRate = 12m,
                UtilityBill = 50000m,
                WhtRate = 10m,
                VatRate = 15m,
                AgreementValue = 36000m,
                LeaseStatus = "active",
                PaymentSchedules = new List<LeasePaymentSchedule>
                {
                    new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 100000m },
                    new LeasePaymentSchedule { LeaseYear = 2, GrossAmount = 100000m },
                    new LeasePaymentSchedule { LeaseYear = 3, GrossAmount = 120000m },
                    new LeasePaymentSchedule { LeaseYear = 4, GrossAmount = 120000m },
                    new LeasePaymentSchedule { LeaseYear = 5, GrossAmount = 150000m }
                }
            };

            db.Leases.Add(lease);
            await db.SaveChangesAsync();
            leaseId = lease.LeaseId;
        }

        var cashflowResp = await client.GetAsync($"/api/leases/{leaseId}/payment-cashflows");
        await EnsureSuccess(cashflowResp, HttpStatusCode.OK);

        var cashflow = await cashflowResp.Content.ReadFromJsonAsync<CashflowResponseDto>();
        Assert.NotNull(cashflow);
        Assert.Equal(leaseId, cashflow!.Lease.LeaseId);
        Assert.Equal(60, cashflow.Cashflows.Count);
        Assert.Equal(7080000m, cashflow.Totals.TotalGrossRent);
        Assert.Equal(1199999.88m, cashflow.Totals.TotalRentAdvanceDeduction);
        Assert.Equal(5880000.12m, cashflow.Totals.TotalNetCashFlow);
        Assert.Equal(100000m, cashflow.Cashflows[0].GrossRent);
        Assert.Equal(33333.33m, cashflow.Cashflows[0].RentAdvanceDeduction);
        Assert.Equal(120000m, cashflow.Cashflows[36].GrossRent);
        Assert.Equal(0m, cashflow.Cashflows[36].RentAdvanceDeduction);
    }

    [Fact]
    public async Task GetPaymentCashflowSummary_ReturnsPrimaryDetailsAndTotals_WithoutScheduleRows()
    {
        var clientFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("IntegrationTesting");
            builder.ConfigureServices(services =>
            {
                var descriptors = services.Where(d => d.ServiceType == typeof(DbContextOptions<IFRSDbContext>) || d.ServiceType == typeof(IFRSDbContext)).ToList();
                foreach (var descriptor in descriptors)
                {
                    services.Remove(descriptor);
                }

                var databaseName = $"cashflow-summary-{Guid.NewGuid()}";
                services.AddDbContext<IFRSDbContext>(options => options.UseInMemoryDatabase(databaseName, DatabaseRoot));
            });
        });

        var client = clientFactory.CreateClient();

        int leaseId;
        using (var scope = clientFactory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IFRSDbContext>();

            var branch = new Branch
            {
                BranchName = "Summary Branch",
                OracleCode = "SM001",
                Lessee = "Summary Lessee",
                Status = "active"
            };

            var lessor = new Lessor
            {
                FullName = "Summary Lessor",
                Nic = "888888888V",
                Address = "Summary Address",
                BankName = "Test Bank",
                AccountNumber = "888888"
            };

            db.Branches.Add(branch);
            db.Lessors.Add(lessor);
            await db.SaveChangesAsync();

            var lease = new Lease
            {
                BranchId = branch.BranchId,
                LessorId = lessor.LessorId,
                LeaseNo = "SM-100",
                LeasePropertyAddress = "123 Summary Street",
                StartDate = new DateOnly(2026, 1, 1),
                EndDate = new DateOnly(2030, 12, 31),
                NumberOfYears = 5,
                RentAdvance = 1200000m,
                RentAdvancePeriod = 36,
                RefundableDeposit = 400000m,
                AnnualRate = 12m,
                LeaseStatus = "active",
                PaymentSchedules = new List<LeasePaymentSchedule>
                {
                    new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 100000m },
                    new LeasePaymentSchedule { LeaseYear = 2, GrossAmount = 100000m },
                    new LeasePaymentSchedule { LeaseYear = 3, GrossAmount = 120000m },
                    new LeasePaymentSchedule { LeaseYear = 4, GrossAmount = 120000m },
                    new LeasePaymentSchedule { LeaseYear = 5, GrossAmount = 150000m }
                }
            };

            db.Leases.Add(lease);
            await db.SaveChangesAsync();
            leaseId = lease.LeaseId;
        }

        var response = await client.GetAsync($"/api/leases/{leaseId}/payment-cashflow-summary");
        await EnsureSuccess(response, HttpStatusCode.OK);

        var summary = await response.Content.ReadFromJsonAsync<CashflowSummaryDto>();
        Assert.NotNull(summary);
        Assert.Equal(12m, summary!.AnnualRate);
        Assert.Equal(5, summary.Period);
        Assert.Equal(1200000m, summary.Advance);
        Assert.Equal(36, summary.AdvancePeriod);
        Assert.Equal("End of Month", summary.PaymentTiming);
        Assert.Equal("123 Summary Street", summary.Address);
        Assert.Equal(7080000m, summary.Totals.TotalGrossRent);
        Assert.Equal(1199999.88m, summary.Totals.TotalRentAdvanceDeduction);
        Assert.Equal(5880000.12m, summary.Totals.TotalNetCashFlow);
        Assert.Equal(4175585.61m, summary.Totals.TotalPresentValue);
    }

    [Fact]
    public async Task GetPaymentCashflows_ReturnsIsPaymentAtBeginning_True_WhenLeaseIsBeginningOfMonth()
    {
        var dbName = $"cashflow-begin-{Guid.NewGuid()}";
        var clientFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("IntegrationTesting");
            builder.ConfigureServices(services =>
            {
                var descriptors = services.Where(d => d.ServiceType == typeof(DbContextOptions<IFRSDbContext>) || d.ServiceType == typeof(IFRSDbContext)).ToList();
                foreach (var descriptor in descriptors)
                    services.Remove(descriptor);

                services.AddDbContext<IFRSDbContext>(options => options.UseInMemoryDatabase(dbName, DatabaseRoot));
            });
        });

        var client = clientFactory.CreateClient();

        int leaseId;
        using (var scope = clientFactory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IFRSDbContext>();

            var branch = new Branch { BranchName = "Begin Branch", OracleCode = "BG001", Lessee = "Begin Lessee", Status = "active" };
            var lessor = new Lessor { FullName = "Begin Lessor", Nic = "111111111V", Address = "Begin Address", BankName = "Test Bank", AccountNumber = "111111" };
            db.Branches.Add(branch);
            db.Lessors.Add(lessor);
            await db.SaveChangesAsync();

            var lease = new Lease
            {
                BranchId = branch.BranchId,
                LessorId = lessor.LessorId,
                LeaseNo = "BG-100",
                StartDate = new DateOnly(2026, 1, 1),
                EndDate = new DateOnly(2030, 12, 31),
                NumberOfYears = 5,
                AnnualRate = 9.71m,
                IsPaymentAtBeginning = true,
                LeaseStatus = "active",
                PaymentSchedules = new List<LeasePaymentSchedule>
                {
                    new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 200000m },
                    new LeasePaymentSchedule { LeaseYear = 2, GrossAmount = 200000m },
                    new LeasePaymentSchedule { LeaseYear = 3, GrossAmount = 200000m },
                    new LeasePaymentSchedule { LeaseYear = 4, GrossAmount = 200000m },
                    new LeasePaymentSchedule { LeaseYear = 5, GrossAmount = 200000m }
                }
            };

            db.Leases.Add(lease);
            await db.SaveChangesAsync();
            leaseId = lease.LeaseId;
        }

        var resp = await client.GetAsync($"/api/leases/{leaseId}/payment-cashflows");
        await EnsureSuccess(resp, HttpStatusCode.OK);

        var cashflow = await resp.Content.ReadFromJsonAsync<CashflowResponseDto>();
        Assert.NotNull(cashflow);
        Assert.True(cashflow!.Lease.IsPaymentAtBeginning);
        // first payment is not discounted — factor must be exactly 1.0
        Assert.Equal(1.000000m, cashflow.Cashflows[0].DiscountFactor);
    }

    [Fact]
    public async Task GetPaymentCashflows_BeginningOfMonth_TotalPresentValueIsGreaterThanEndOfMonth()
    {
        var dbName = $"cashflow-compare-{Guid.NewGuid()}";
        var clientFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("IntegrationTesting");
            builder.ConfigureServices(services =>
            {
                var descriptors = services.Where(d => d.ServiceType == typeof(DbContextOptions<IFRSDbContext>) || d.ServiceType == typeof(IFRSDbContext)).ToList();
                foreach (var descriptor in descriptors)
                    services.Remove(descriptor);

                services.AddDbContext<IFRSDbContext>(options => options.UseInMemoryDatabase(dbName, DatabaseRoot));
            });
        });

        var client = clientFactory.CreateClient();

        int beginLeaseId, endLeaseId;
        using (var scope = clientFactory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IFRSDbContext>();

            var branch = new Branch { BranchName = "Compare Branch", OracleCode = "CMP01", Lessee = "Compare Lessee", Status = "active" };
            var lessor = new Lessor { FullName = "Compare Lessor", Nic = "222222222V", Address = "Compare Address", BankName = "Test Bank", AccountNumber = "222222" };
            db.Branches.Add(branch);
            db.Lessors.Add(lessor);
            await db.SaveChangesAsync();

            var schedules = new List<LeasePaymentSchedule>
            {
                new LeasePaymentSchedule { LeaseYear = 1, GrossAmount = 200000m },
                new LeasePaymentSchedule { LeaseYear = 2, GrossAmount = 200000m },
                new LeasePaymentSchedule { LeaseYear = 3, GrossAmount = 200000m },
                new LeasePaymentSchedule { LeaseYear = 4, GrossAmount = 200000m },
                new LeasePaymentSchedule { LeaseYear = 5, GrossAmount = 200000m }
            };

            var beginLease = new Lease
            {
                BranchId = branch.BranchId,
                LessorId = lessor.LessorId,
                LeaseNo = "CMP-BEGIN",
                StartDate = new DateOnly(2026, 1, 1),
                EndDate = new DateOnly(2030, 12, 31),
                NumberOfYears = 5,
                AnnualRate = 9.71m,
                IsPaymentAtBeginning = true,
                LeaseStatus = "active",
                PaymentSchedules = schedules
            };

            var endLease = new Lease
            {
                BranchId = branch.BranchId,
                LessorId = lessor.LessorId,
                LeaseNo = "CMP-END",
                StartDate = new DateOnly(2026, 1, 1),
                EndDate = new DateOnly(2030, 12, 31),
                NumberOfYears = 5,
                AnnualRate = 9.71m,
                IsPaymentAtBeginning = false,
                LeaseStatus = "active",
                PaymentSchedules = schedules.Select(s => new LeasePaymentSchedule { LeaseYear = s.LeaseYear, GrossAmount = s.GrossAmount }).ToList()
            };

            db.Leases.Add(beginLease);
            db.Leases.Add(endLease);
            await db.SaveChangesAsync();
            beginLeaseId = beginLease.LeaseId;
            endLeaseId = endLease.LeaseId;
        }

        var beginResp = await client.GetAsync($"/api/leases/{beginLeaseId}/payment-cashflows");
        var endResp = await client.GetAsync($"/api/leases/{endLeaseId}/payment-cashflows");
        await EnsureSuccess(beginResp, HttpStatusCode.OK);
        await EnsureSuccess(endResp, HttpStatusCode.OK);

        var beginCashflow = await beginResp.Content.ReadFromJsonAsync<CashflowResponseDto>();
        var endCashflow = await endResp.Content.ReadFromJsonAsync<CashflowResponseDto>();
        Assert.NotNull(beginCashflow);
        Assert.NotNull(endCashflow);
        Assert.True(beginCashflow!.Totals.TotalPresentValue > endCashflow!.Totals.TotalPresentValue);
    }

    private static async Task EnsureSuccess(HttpResponseMessage resp, HttpStatusCode expected)
    {
        if (resp.StatusCode != expected)
        {
            var text = await resp.Content.ReadAsStringAsync();
            Assert.Fail($"Expected {(int)expected} but got {(int)resp.StatusCode}. Body:\n{text}");
        }
    }
}