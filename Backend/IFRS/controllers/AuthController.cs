using IFRS.models;
using IFRS.services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IFRS.controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly IWebHostEnvironment _env;
    private const string RefreshTokenCookie = "refreshToken";
    private const string AccessTokenCookie = "accessToken";

    public AuthController(AuthService authService, IWebHostEnvironment env)
    {
        _authService = authService;
        _env = env;
    }

    [AllowAnonymous]
    [HttpGet("setup")]
    public async Task<IActionResult> CheckSetup()
    {
        var canRegister = await _authService.IsUserTableEmptyAsync();
        return Ok(new { canRegister });
    }

    [AllowAnonymous]
    [HttpPost("setup")]
    public async Task<IActionResult> RegisterAdmin(RegisterAdminRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (!await _authService.IsUserTableEmptyAsync())
            return StatusCode(403, new { message = "Admin user already exists." });

        var (response, refreshToken) = await _authService.RegisterAdminAsync(request);
        SetRefreshTokenCookie(refreshToken);
        SetAccessTokenCookie(response.AccessToken);
        return Ok(response);
    }

    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var result = await _authService.AuthenticateAsync(request);
        if (result == null)
            return Unauthorized(new { message = "Invalid email or password." });

        var (response, refreshToken) = result.Value;
        SetRefreshTokenCookie(refreshToken);
        SetAccessTokenCookie(response.AccessToken);
        return Ok(response);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    [Consumes("application/json")]
    public async Task<IActionResult> Refresh()
    {
        var incomingToken = Request.Cookies[RefreshTokenCookie];
        if (string.IsNullOrEmpty(incomingToken))
            return Unauthorized(new { message = "No refresh token." });

        var result = await _authService.RefreshAsync(incomingToken);
        if (result == null)
        {
            ClearRefreshTokenCookie();
            return Unauthorized(new { message = "Invalid or expired refresh token." });
        }

        var (response, newRefreshToken) = result.Value;
        SetRefreshTokenCookie(newRefreshToken);
        SetAccessTokenCookie(response.AccessToken);
        return Ok(response);
    }

    [Authorize]
    [HttpPost("logout")]
    [Consumes("application/json")]
    public async Task<IActionResult> Logout()
    {
        var incomingToken = Request.Cookies[RefreshTokenCookie];

        if (!string.IsNullOrEmpty(incomingToken))
            await _authService.LogoutAsync(incomingToken);

        ClearRefreshTokenCookie();
        ClearAccessTokenCookie();
        return Ok(new { message = "Logged out successfully." });
    }

    private bool IsSecureRequest() => Request.IsHttps || 
        Request.Headers["X-Forwarded-Proto"].ToString() == "https";

    private void SetRefreshTokenCookie(string token)
    {
        if (_env.IsEnvironment("IntegrationTesting"))
            return;

        Response.Cookies.Append(RefreshTokenCookie, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = IsSecureRequest(),
            SameSite = SameSiteMode.None,
            Expires = DateTimeOffset.UtcNow.AddHours(8)
        });
    }

    private void SetAccessTokenCookie(string token)
    {
        if (_env.IsEnvironment("IntegrationTesting"))
            return;

        Response.Cookies.Append(AccessTokenCookie, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = IsSecureRequest(),
            SameSite = SameSiteMode.None,
            Expires = DateTimeOffset.UtcNow.AddMinutes(15)
        });
    }

    private void ClearRefreshTokenCookie()
    {
        if (_env.IsEnvironment("IntegrationTesting"))
            return;

        Response.Cookies.Delete(RefreshTokenCookie, new CookieOptions
        {
            HttpOnly = true,
            Secure = IsSecureRequest(),
            SameSite = SameSiteMode.None
        });
    }

    private void ClearAccessTokenCookie()
    {
        if (_env.IsEnvironment("IntegrationTesting"))
            return;

        Response.Cookies.Delete(AccessTokenCookie, new CookieOptions
        {
            HttpOnly = true,
            Secure = IsSecureRequest(),
            SameSite = SameSiteMode.None
        });
    }
}
