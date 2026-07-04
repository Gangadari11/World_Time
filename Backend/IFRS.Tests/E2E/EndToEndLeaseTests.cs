using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using IFRS.models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using IFRS.Data;
using Xunit;

namespace IFRS.Tests.Integration;

public class EndToEndIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public EndToEndIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task AdminRegister_Login_CreateBranch_CreateLessor_CreateLease_EndToEnd()
    {
        var databaseName = $"ifrs_integration_db_{Guid.NewGuid():N}";
        var clientFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("IntegrationTesting");
            builder.ConfigureServices(services =>
            {
                // Replace the real database with an isolated in-memory database for the test run.
                var descriptors = services.Where(d => d.ServiceType == typeof(DbContextOptions<IFRSDbContext>) || d.ServiceType == typeof(IFRSDbContext)).ToList();
                foreach (var d in descriptors)
                    services.Remove(d);

                services.AddControllers().AddNewtonsoftJson();
                services.AddDbContext<IFRSDbContext>(options => options.UseInMemoryDatabase(databaseName));
            });
        });

        var client = clientFactory.CreateClient();

        // Check setup
        var setupResp = await client.GetAsync("/api/auth/setup");
        await EnsureSuccess(setupResp, HttpStatusCode.OK);

        // Register admin
        var registerResp = await client.PostAsJsonAsync("/api/auth/setup", new RegisterAdminRequest
        {
            Email = "admin@integration.local",
            Password = "P@ssword123",
            FullName = "Integration Admin"
        });
        await EnsureSuccess(registerResp, HttpStatusCode.OK);

        // Login
        var loginResp = await client.PostAsJsonAsync("/api/auth", new LoginRequest
        {
            Email = "admin@integration.local",
            Password = "P@ssword123"
        });
        await EnsureSuccess(loginResp, HttpStatusCode.OK);
        var loginData = await loginResp.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(loginData);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginData!.AccessToken);

        // Protected endpoint should now succeed with the real JWT
        var usersResp = await client.GetAsync("/api/users");
        await EnsureSuccess(usersResp, HttpStatusCode.OK);

        // Create Branch
        var branchResp = await client.PostAsJsonAsync("/api/branches", new Branch
        {
            BranchName = "Integration Branch",
            OracleCode = "INT001",
            Lessee = "Integration Lessee",
            Status = "active"
        });
        await EnsureSuccess(branchResp, HttpStatusCode.Created);
        var branchDto = await branchResp.Content.ReadFromJsonAsync<IFRS.models.DTOs.BranchDetailDto>();
        Assert.NotNull(branchDto);

        // Create Lessor
        var lessorResp = await client.PostAsJsonAsync("/api/lessors", new Lessor
        {
            FullName = "Integration Lessor",
            Nic = "999999999V",
            Address = "Integration Address",
            BankName = "Test Bank",
            AccountNumber = "123456"
        });
        await EnsureSuccess(lessorResp, HttpStatusCode.Created);
        var lessorDto = await lessorResp.Content.ReadFromJsonAsync<IFRS.models.DTOs.LessorDetailDto>();
        Assert.NotNull(lessorDto);

        // Create Lease referencing branch and lessor
        var leaseResp = await client.PostAsJsonAsync("/api/leases", new Lease
        {
            BranchId = branchDto!.BranchId,
            LessorId = lessorDto!.LessorId,
            LeaseNo = "L-100",
            LeasePropertyAddress = "123 Integration St",
            Sqft = 1000,
            StartDate = new DateOnly(DateTime.UtcNow.Year - 1, DateTime.UtcNow.Month, 1),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(2)),
            NumberOfYears = 1,
            RentAdvance = 1200000m,
            RentAdvancePeriod = 36,
            RefundableDeposit = 400000m,
            AgreementValue = 2000000m,
            AnnualRate = 5m,
            UtilityBill = 50000m,
            WhtRate = 10m,
            VatRate = 15m,
            LeaseStatus = "Terminate",
            PaymentSchedules = new List<LeasePaymentSchedule>
            {
                new LeasePaymentSchedule
                {
                    GrossAmount = 10000m
                }
            }
        });

        await EnsureSuccess(leaseResp, HttpStatusCode.Created);
        var leaseDto = await leaseResp.Content.ReadFromJsonAsync<IFRS.models.DTOs.LeaseDto>();
        Assert.NotNull(leaseDto);
        Assert.Equal(branchDto.BranchId, leaseDto!.BranchId);
        Assert.Equal(lessorDto.LessorId, leaseDto.LessorId);

        // Fetch the lease by id and verify details
        var getLeaseResp = await client.GetAsync($"/api/leases/{leaseDto.LeaseId}");
        await EnsureSuccess(getLeaseResp, HttpStatusCode.OK);
        var fetchedLease = await getLeaseResp.Content.ReadFromJsonAsync<IFRS.models.DTOs.LeaseDto>();
        Assert.NotNull(fetchedLease);
        Assert.Equal(leaseDto.LeaseId, fetchedLease!.LeaseId);
        Assert.Equal(leaseDto.BranchId, fetchedLease.BranchId);
        Assert.Equal(leaseDto.LessorId, fetchedLease.LessorId);
        Assert.Equal(leaseDto.LeaseNo, fetchedLease.LeaseNo);
        Assert.Equal(leaseDto.LeasePropertyAddress, fetchedLease.LeasePropertyAddress);
        Assert.Equal(leaseDto.AgreementValue, fetchedLease.AgreementValue);
        Assert.Equal(1200000m, fetchedLease.OutstandingReceivableFromLessor);
        Assert.Single(fetchedLease.PaymentSchedules);
        Assert.Equal(10000m, fetchedLease.PaymentSchedules.First().GrossAmount);
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
