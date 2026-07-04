using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace IFRS.Notifications.Helpers;

/// <summary>
/// Resolves SignalR user connections from the JWT subject claim.
/// </summary>
public sealed class SignalRUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        return connection.User?.FindFirst("sub")?.Value
            ?? connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}
