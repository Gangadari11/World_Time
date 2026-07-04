using Microsoft.Extensions.Configuration;

namespace IFRS.Tests.TestHelpers;

internal static class ConfigurationFactory
{
    public static IConfiguration CreateJwtConfiguration(
        string key = "test-signing-key-1234567890-very-long-enough-for-hs256",
        string issuer = "ifrs-test-issuer",
        string audience = "ifrs-test-audience")
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = key,
                ["Jwt:Issuer"] = issuer,
                ["Jwt:Audience"] = audience
            })
            .Build();
    }
}