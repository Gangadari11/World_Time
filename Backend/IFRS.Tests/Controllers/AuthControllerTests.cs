using IFRS.controllers;
using IFRS.Data;
using IFRS.models;
using IFRS.services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IFRS.Tests.TestHelpers;
using Xunit;


namespace IFRS.Tests.Controllers;

public class AuthControllerTests
{
    [Fact]
    public async Task Setup_Register_Login_Refresh_Logout_Flow()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        var jwt = new JwtService(ConfigurationFactory.CreateJwtConfiguration());

        var authService = new AuthService(
            db,
            jwt);
        var env = new IFRS.Tests.TestHelpers.HostingEnvironmentStub("Development");
        var controller = new AuthController(authService, env);

        var ctx = new DefaultHttpContext();
        controller.ControllerContext = new ControllerContext { HttpContext = ctx };

        // Initially empty
        var setup = await controller.CheckSetup();
        Assert.IsType<OkObjectResult>(setup);

        // Register admin
        var registerResult = await controller.RegisterAdmin(new RegisterAdminRequest
        {
            Email = "admin@test.local",
            Password = "P@ssword123",
            FullName = "Admin"
        });
        Assert.IsType<OkObjectResult>(registerResult);
        Assert.Contains("Set-Cookie", ctx.Response.Headers.Keys);

        // Login
        var loginResult = await controller.Login(new LoginRequest
        {
            Email = "admin@test.local",
            Password = "P@ssword123"
        });
        Assert.IsType<OkObjectResult>(loginResult);

        // Extract refresh token from response cookies (Set-Cookie header)
        var setCookie = ctx.Response.Headers["Set-Cookie"].ToString();
        var cookieParts = setCookie.Split(';').Select(p => p.Trim()).ToArray();
        var refreshCookieSegment = cookieParts.FirstOrDefault(p => p.StartsWith("refreshToken="));
        var refreshTokenValue = refreshCookieSegment?.Substring("refreshToken=".Length) ?? string.Empty;

        // Prepare a new context for refresh request
        var ctx2 = new DefaultHttpContext();
        ctx2.Request.Headers["Cookie"] = $"refreshToken={refreshTokenValue}";
        controller.ControllerContext = new ControllerContext { HttpContext = ctx2 };

        var refreshResult = await controller.Refresh();
        Assert.IsType<OkObjectResult>(refreshResult);

        // Logout
        // Need a context with cookie present
        var ctx3 = new DefaultHttpContext();
        ctx3.Request.Headers["Cookie"] = $"refreshToken={refreshTokenValue}";
        controller.ControllerContext = new ControllerContext { HttpContext = ctx3 };

        var logoutResult = await controller.Logout();
        Assert.IsType<OkObjectResult>(logoutResult);
    }

    [Fact]
    public async Task Login_InvalidCredentials_ReturnsUnauthorized()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        var jwt = new JwtService(ConfigurationFactory.CreateJwtConfiguration());

        var authService = new AuthService(
            db,
            jwt);        
        var env = new IFRS.Tests.TestHelpers.HostingEnvironmentStub("Development");
        var controller = new AuthController(authService, env);

        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.Login(new LoginRequest
        {
            Email = "noone@nowhere",
            Password = "wrong-pass"
        });

        Assert.IsType<UnauthorizedObjectResult>(result);
    }
}
