using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace IFRS.Tests.Infrastructure;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("IntegrationTesting");

        builder.ConfigureServices(services =>
        {
            services.AddAuthentication(TestAuthScheme.Scheme)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    TestAuthScheme.Scheme, _ => { });

            services.AddAuthorization(options =>
            {
                options.DefaultPolicy = new AuthorizationPolicyBuilder(TestAuthScheme.Scheme)
                    .RequireAuthenticatedUser()
                    .Build();
            });
        });
    }
}
