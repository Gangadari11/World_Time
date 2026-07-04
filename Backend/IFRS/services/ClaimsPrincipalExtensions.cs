using System.Security.Claims;

namespace IFRS.services;

public static class ClaimsPrincipalExtensions
{
    public static int? GetCurrentUserId(this ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst("sub")?.Value
            ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return userIdClaim != null && int.TryParse(userIdClaim, out var userId)
            ? userId
            : null;
    }
}