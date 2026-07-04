using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace IFRS.Notifications.Helpers;

/// <summary>
/// Extracts the authenticated user id from the JWT subject claim.
/// </summary>
public static class ClaimsPrincipalExtensions
{
    public static int? GetUserId(this ClaimsPrincipal? principal)
    {
        if (principal == null)
            return null;

        var userIdClaim = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
