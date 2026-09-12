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
    Task<LoginResponse> RegisterStoreAsync(RegisterStoreRequest request);
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

    public async Task<LoginResponse> RegisterStoreAsync(RegisterStoreRequest request)
    {
        var cleanUsername = request.Username.Trim().ToLower();
        var exists = await _db.Users.AnyAsync(u => u.Username.ToLower() == cleanUsername);
        if (exists)
        {
            throw new InvalidOperationException("Yeh username pehle se mojood hai. Barah-e-karam doosra muntakhib karein. (Username already taken)");
        }

        // 1. Create Store
        var store = new Store
        {
            Name = string.IsNullOrWhiteSpace(request.StoreName) ? "Meri Dukaan" : request.StoreName.Trim(),
            OwnerName = request.OwnerFullName.Trim(),
            Phone = request.Phone?.Trim(),
            City = string.IsNullOrWhiteSpace(request.City) ? "Pakistan" : request.City.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.Stores.Add(store);
        await _db.SaveChangesAsync();

        // 2. Create Owner User
        var user = new User
        {
            StoreId = store.Id,
            Username = cleanUsername,
            FullName = string.IsNullOrWhiteSpace(request.OwnerFullName) ? "Dukaan Owner" : request.OwnerFullName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.OWNER,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // 3. Seed Starter Categories for this store
        var starterCategories = new List<Category>
        {
            new() { StoreId = store.Id, Name = "General Ration (Galla / Daalein)", UrduName = "غلہ و راشن", DisplayOrder = 1 },
            new() { StoreId = store.Id, Name = "Spices & Cooking (Masalajat & Oil)", UrduName = "مصالحہ جات و گھی", DisplayOrder = 2 },
            new() { StoreId = store.Id, Name = "Snacks & Beverages", UrduName = "بسکٹ، چپس و مشروبات", DisplayOrder = 3 },
            new() { StoreId = store.Id, Name = "Dairy & Bakery", UrduName = "دودھ، ڈبل روٹی و بیکری", DisplayOrder = 4 },
            new() { StoreId = store.Id, Name = "Personal Care & Soap", UrduName = "صابن و صفائی اشیاء", DisplayOrder = 5 }
        };
        _db.Categories.AddRange(starterCategories);
        await _db.SaveChangesAsync();

        user.Store = store;
        var token = GenerateJwtToken(user);
        var userDto = new UserDto(user.Id, user.Username, user.FullName, user.Role.ToString(), store.Id, store.Name);
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

