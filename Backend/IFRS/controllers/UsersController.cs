using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using IFRS.Data;
using IFRS.models;
using IFRS.services;

namespace IFRS.controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IFRSDbContext _context;
    private readonly AuthService _authService;

    public UsersController(IFRSDbContext context, AuthService authService)
    {
        _context = context;
        _authService = authService;
    }

    // GET: api/users
    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .Select(u => new UserResponse
            {
                UserId = u.UserId,
                FullName = u.FullName!,
                Email = u.Email!,
                Role = u.Role.ToString(),
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    // GET: api/users/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        return Ok(new UserResponse
        {
            UserId = user.UserId,
            FullName = user.FullName!,
            Email = user.Email!,
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt
        });
    }

    // POST: api/users  (admin only)
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateUser(CreateUserRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var (user, error) = await _authService.CreateUserAsync(request);
        if (error != null)
            return BadRequest(new { message = error });

        return CreatedAtAction(nameof(GetUser), new { id = user!.UserId }, user);
    }

    // PUT: api/users/profile  (logged in user)
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userIdClaim = User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { message = "Invalid token." });

        var (user, error) = await _authService.UpdateProfileAsync(userId, request);
        if (error != null)
            return BadRequest(new { message = error });

        return Ok(user);
    }

    // PUT: api/users/{id}  (admin only)
    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateUser(int id, UpdateUserRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var (user, error) = await _authService.UpdateUserAsync(id, request);
        if (error != null)
            return BadRequest(new { message = error });

        return Ok(user);
    }

    // DELETE: api/users/{id}  (admin only)
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User deleted successfully." });
    }
}
