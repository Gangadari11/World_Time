using IFRS.Data;
using IFRS.models;
using IFRS.services;
using Hangfire.PostgreSql;
using IFRS.Notifications.BackgroundJobs;
using IFRS.Notifications.Helpers;
using IFRS.Notifications.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Hangfire;
using Microsoft.AspNetCore.SignalR;


// Disable default claim type mapping so 'sub' stays as 'sub'
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);
var isIntegrationTesting = builder.Environment.IsEnvironment("IntegrationTesting");

// Add services to the container
if (isIntegrationTesting)
{
    builder.Services.AddControllers().AddNewtonsoftJson();
}
else
{
    builder.Services.AddControllers();
}

builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddSingleton<IUserIdProvider, SignalRUserIdProvider>();


// Add DbContext with PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Port=5432;Database=ifrs_db;Username=postgres;Password=password";

var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(connectionString);
dataSourceBuilder.MapEnum<UserRole>("user_role");
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<IFRSDbContext>(options =>
    options.UseNpgsql(dataSource));

builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<CashflowService>();
builder.Services.AddScoped<IFRS.Notifications.Interfaces.INotificationRepository, IFRS.Notifications.Repositories.NotificationRepository>();
builder.Services.AddScoped<IFRS.Notifications.Interfaces.INotificationService, IFRS.Notifications.Services.NotificationService>();
if (!isIntegrationTesting)
{
    builder.Services.AddHangfire(configuration => configuration.UsePostgreSqlStorage(connectionString));
    builder.Services.AddHangfireServer();
}
builder.Services.AddScoped<EntityChangeRequestService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwt = builder.Configuration.GetSection("Jwt");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"] ?? string.Empty)),
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrWhiteSpace(accessToken) &&
                    path.StartsWithSegments("/hubs/notifications", StringComparison.OrdinalIgnoreCase))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>() ?? [];

    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddAntiforgery();

var app = builder.Build();

var applyMigrationsOnStartup = app.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup");
if (applyMigrationsOnStartup && !isIntegrationTesting)
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider
        .GetRequiredService<ILoggerFactory>()
        .CreateLogger("DatabaseStartup");

    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<IFRSDbContext>();
        dbContext.Database.Migrate();
        logger.LogInformation("Applied pending EF Core migrations on startup.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to apply EF Core migrations on startup.");
        throw;
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAll");
if (!isIntegrationTesting)
{
    app.UseCookiePolicy(new CookiePolicyOptions
    {
        MinimumSameSitePolicy = SameSiteMode.None,
        HttpOnly = Microsoft.AspNetCore.CookiePolicy.HttpOnlyPolicy.Always,
        Secure = CookieSecurePolicy.SameAsRequest
    });
}
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

if (!isIntegrationTesting)
{
    using var scope = app.Services.CreateScope();
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();

    recurringJobManager.AddOrUpdate<LeaseExpiryNotificationJob>(
        "notifications-lease-expiry",
        job => job.ExecuteAsync(),
        Cron.Daily);
}

if (app.Environment.IsDevelopment() && !isIntegrationTesting)
{
    app.UseHangfireDashboard("/hangfire");
}

app.Run();

// Expose the implicit Program class for integration testing
public partial class Program { }
