using IFRS.Data;
using IFRS.models;
using Microsoft.EntityFrameworkCore;


namespace IFRS.services;

public class AuthService
{
    private readonly IFRSDbContext _db;
    private readonly JwtService _jwtService;

    public AuthService(IFRSDbContext db, JwtService jwtService)
    {
        _db = db;
        _jwtService = jwtService;
    }

    public async Task<bool> IsUserTableEmptyAsync()
    {
        return !await _db.Users.AnyAsync();
    }

    public async Task<(AuthResponse response, string refreshToken)> RegisterAdminAsync(RegisterAdminRequest request)
    {
        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            Role = UserRole.admin,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();


        return await BuildAuthResultAsync(user);
    }

    public async Task<(AuthResponse response, string refreshToken)?> AuthenticateAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;


        return await BuildAuthResultAsync(user);
    }

    public async Task<(AuthResponse response, string refreshToken)?> RefreshAsync(string incomingToken)
    {
        var tokenHash = _jwtService.HashToken(incomingToken);

        var stored = await _db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == tokenHash);

        if (stored == null)
            return null;

        if (stored.ExpiresAt < DateTime.UtcNow)
        {
            _db.RefreshTokens.Remove(stored);
            await _db.SaveChangesAsync();
            return null;
        }

        var user = stored.User;

        _db.RefreshTokens.Remove(stored);
        await _db.SaveChangesAsync();

        return await BuildAuthResultAsync(user);
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var tokenHash = _jwtService.HashToken(refreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.Token == tokenHash);
        if (stored != null)
        {
            _db.RefreshTokens.Remove(stored);
            await _db.SaveChangesAsync();
        }
    }

    public async Task<(UserResponse? user, string? error)> CreateUserAsync(CreateUserRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            return (null, "Email already exists.");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            Role = request.Role,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();


        return (new UserResponse
        {
            UserId = user.UserId,
            FullName = user.FullName!,
            Email = user.Email!,
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt
        }, null);
    }

    public async Task<(UserResponse? user, string? error)> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            return (null, "User not found.");

        if (user.Email != request.Email && await _db.Users.AnyAsync(u => u.Email == request.Email))
            return (null, "Email already exists.");

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                return (null, "Current password is required to set a new password.");

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                return (null, "Current password is incorrect.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        }

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return (new UserResponse
        {
            UserId = user.UserId,
            FullName = user.FullName!,
            Email = user.Email!,
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt
        }, null);
    }

    public async Task<(UserResponse? user, string? error)> UpdateUserAsync(int userId, UpdateUserRequest request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            return (null, "User not found.");

        if (user.Email != request.Email && await _db.Users.AnyAsync(u => u.Email == request.Email))
            return (null, "Email already exists.");

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.Role = request.Role;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return (new UserResponse
        {
            UserId = user.UserId,
            FullName = user.FullName!,
            Email = user.Email!,
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt
        }, null);
    }

    private async Task<(AuthResponse response, string refreshToken)> BuildAuthResultAsync(User user)
    {
        var accessToken = _jwtService.GenerateAccessToken(user.UserId, user.Email!, user.Role, user.FullName!);
        var rawRefreshToken = _jwtService.GenerateRefreshToken();
        var hashedRefreshToken = _jwtService.HashToken(rawRefreshToken);

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.UserId,
            Token = hashedRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(8),
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        return (new AuthResponse(accessToken, user.UserId, user.Role.ToString(), user.FullName!), rawRefreshToken);
    }

    
}
