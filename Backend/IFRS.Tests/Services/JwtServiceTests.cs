using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using IFRS.models;
using IFRS.services;
using IFRS.Tests.TestHelpers;
using Xunit;

namespace IFRS.Tests.Services;

public class JwtServiceTests
{
    [Fact]
    public void GenerateRefreshToken_ReturnsBase64StringWithExpectedLength()
    {
        var service = new JwtService(ConfigurationFactory.CreateJwtConfiguration());

        var token = service.GenerateRefreshToken();

        var bytes = Convert.FromBase64String(token);
        Assert.Equal(64, bytes.Length);
    }

    [Fact]
    public void HashToken_ReturnsLowercaseSha256Hex()
    {
        var service = new JwtService(ConfigurationFactory.CreateJwtConfiguration());

        var hash = service.HashToken("abc123");

        Assert.Equal(64, hash.Length);
        Assert.Equal(hash, hash.ToLowerInvariant());
    }

    [Fact]
    public void GenerateAccessToken_WritesExpectedClaims()
    {
        var service = new JwtService(ConfigurationFactory.CreateJwtConfiguration());

        var token = service.GenerateAccessToken(42, "admin@example.com", UserRole.admin, "Admin User");
        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(token);

        Assert.Equal("ifrs-test-issuer", parsed.Issuer);
        Assert.Contains("ifrs-test-audience", parsed.Audiences);
        Assert.Equal("42", parsed.Claims.First(c => c.Type == JwtRegisteredClaimNames.Sub).Value);
        Assert.Equal("admin@example.com", parsed.Claims.First(c => c.Type == JwtRegisteredClaimNames.Email).Value);
        Assert.Equal("Admin User", parsed.Claims.First(c => c.Type == ClaimTypes.Name).Value);
        Assert.Equal("admin", parsed.Claims.First(c => c.Type == ClaimTypes.Role).Value);
    }
}