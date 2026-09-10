using System.Text;
using DukaanOS.API.Data;
using DukaanOS.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Configuration (PostgreSQL)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=dukaanos_db;Username=postgres;Password=SaadKhan1966";

builder.Services.AddDbContext<DukaanDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// 2. JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "DukaanOS_SuperSecretProductionGradeJwtKey_2026_PakistaniRetailOS!#";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "DukaanOS.API",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "DukaanOS.Client",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireOwner", policy => policy.RequireRole("OWNER"));
    options.AddPolicy("RequireCashierOrOwner", policy => policy.RequireRole("OWNER", "CASHIER"));
});

// 3. Register Domain Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<ISaleService, SaleService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IDayClosingService, DayClosingService>();
builder.Services.AddScoped<IAiAssistantService, AiAssistantService>();

// 4. Controllers & CORS
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// 5. Database Auto-Migration & Seeding on Startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DukaanDbContext>();
    try
    {
        await DbInitializer.InitializeAsync(db);
        Console.WriteLine("--> [DukaanOS] PostgreSQL database initialized and seeded successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"--> [DukaanOS] Database initialization error: {ex.Message}");
    }
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
