using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DukaanOS.API.Core.Entities;
using DukaanOS.API.Core.Enums;
using DukaanOS.API.Data;
using DukaanOS.API.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace DukaanOS.API.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<UserDto?> GetCurrentUserAsync(int userId);
    Task<List<UserDto>> GetAllUsersAsync();
}

public class AuthService : IAuthService
{
    private readonly DukaanDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(DukaanDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users
            .Include(u => u.Store)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.Trim().ToLower() && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return null;
        }

        var token = GenerateJwtToken(user);
        var storeName = user.Store?.Name ?? "DukaanOS Store";
        var userDto = new UserDto(user.Id, user.Username, user.FullName, user.Role.ToString(), user.StoreId, storeName);
        return new LoginResponse(token, userDto);
    }

    public async Task<UserDto?> GetCurrentUserAsync(int userId)
    {
        var user = await _db.Users
            .Include(u => u.Store)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || !user.IsActive) return null;
        var storeName = user.Store?.Name ?? "DukaanOS Store";
        return new UserDto(user.Id, user.Username, user.FullName, user.Role.ToString(), user.StoreId, storeName);
    }

    public async Task<List<UserDto>> GetAllUsersAsync()
    {
        return await _db.Users
            .Include(u => u.Store)
            .Select(u => new UserDto(u.Id, u.Username, u.FullName, u.Role.ToString(), u.StoreId, u.Store != null ? u.Store.Name : "DukaanOS Store"))
            .ToListAsync();
    }

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _config["Jwt:Key"] ?? "DukaanOS_SuperSecretProductionGradeJwtKey_2026_PakistaniRetailOS!#";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var storeName = user.Store?.Name ?? "DukaanOS Store";
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("FullName", user.FullName),
            new("StoreId", user.StoreId.ToString()),
            new("StoreName", storeName)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "DukaanOS.API",
            audience: _config["Jwt:Audience"] ?? "DukaanOS.Client",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(Convert.ToDouble(_config["Jwt:ExpiryDays"] ?? "30")),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

