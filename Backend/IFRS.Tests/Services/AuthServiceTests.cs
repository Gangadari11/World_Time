using IFRS.Data;
using IFRS.models;
using IFRS.services;
using IFRS.Tests.TestHelpers;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Moq;
using IFRS.Notifications.Interfaces;

namespace IFRS.Tests.Services;

public class AuthServiceTests
{
    [Fact]
    public async Task IsUserTableEmptyAsync_ReturnsTrue_WhenNoUsersExist()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        var service = CreateService(db);

        var result = await service.IsUserTableEmptyAsync();

        Assert.True(result);
    }

    [Fact]
    public async Task RegisterAdminAsync_CreatesAdminUserAndRefreshToken()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        var service = CreateService(db);

        var (response, refreshToken) = await service.RegisterAdminAsync(new RegisterAdminRequest
        {
            Email = "admin@example.com",
            Password = "P@ssword123!",
            FullName = "Admin User"
        });

        var user = await db.Users.SingleAsync();
        var storedRefreshToken = await db.RefreshTokens.SingleAsync();

        Assert.Equal("admin@example.com", user.Email);
        Assert.Equal(UserRole.admin, user.Role);
        Assert.True(BCrypt.Net.BCrypt.Verify("P@ssword123!", user.PasswordHash));
        Assert.Equal(response.UserId, user.UserId);
        Assert.Equal("Admin User", response.FullName);
        Assert.NotEmpty(refreshToken);
        Assert.NotEqual(refreshToken, storedRefreshToken.Token);
        Assert.Equal(user.UserId, storedRefreshToken.UserId);
    }

    [Fact]
    public async Task AuthenticateAsync_ReturnsNull_WhenPasswordIsInvalid()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        db.Users.Add(new User
        {
            Email = "user@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            FullName = "Normal User",
            Role = UserRole.data_entry,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.AuthenticateAsync(new LoginRequest
        {
            Email = "user@example.com",
            Password = "wrong-password"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateUserAsync_ReturnsError_WhenEmailAlreadyExists()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        db.Users.Add(new User
        {
            Email = "user@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            FullName = "Existing User",
            Role = UserRole.data_entry,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var (user, error) = await service.CreateUserAsync(new CreateUserRequest
        {
            Email = "user@example.com",
            Password = "new-password",
            FullName = "Another User",
            Role = UserRole.data_entry
        });

        Assert.Null(user);
        Assert.Equal("Email already exists.", error);
    }

    [Fact]
    public async Task UpdateProfileAsync_ReturnsError_WhenCurrentPasswordIsMissingForNewPassword()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        db.Users.Add(new User
        {
            UserId = 1,
            Email = "user@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("old-password"),
            FullName = "Normal User",
            Role = UserRole.data_entry,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var (user, error) = await service.UpdateProfileAsync(1, new UpdateProfileRequest
        {
            FullName = "Updated User",
            Email = "user@example.com",
            NewPassword = "new-password"
        });

        Assert.Null(user);
        Assert.Equal("Current password is required to set a new password.", error);
    }

    private static AuthService CreateService(IFRSDbContext db)
    {
        var jwtService = new JwtService(ConfigurationFactory.CreateJwtConfiguration());
        return new AuthService(db, jwtService);
    }
}