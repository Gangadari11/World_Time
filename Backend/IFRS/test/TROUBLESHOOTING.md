# IFRS API - Troubleshooting & Common Commands

## 🆘 Troubleshooting Guide

### Problem: "Connection refused" or "Unable to connect to database"

**Causes:**

1. PostgreSQL service not running
2. Connection string incorrect
3. Database doesn't exist

**Solutions:**

```bash
# 1. Check PostgreSQL is running (Windows)
Get-Service postgresql* | Start-Service

# 2. Verify connection string in appsettings.json
# Format: Host=server;Port=port;Database=db;Username=user;Password=pwd

# 3. Create database manually (if needed)
psql -U postgres -c "CREATE DATABASE ifrs_db;"

# 4. Test connection with psql
psql -h localhost -p 5432 -U postgres -d ifrs_db
```

---

### Problem: "Cannot create a DbContext of type 'IFRSDbContext'"

**Cause:** DbContext not properly registered in Program.cs

**Solution:**
Verify `Program.cs` contains:

```csharp
builder.Services.AddDbContext<IFRSDbContext>(options =>
    options.UseNpgsql(connectionString));
```

---

### Problem: "No migrations found" or migration errors

**Causes:**

1. Migrations not created
2. Migrations folder doesn't exist
3. Model mismatch with database

**Solutions:**

```bash
# 1. Create migrations folder if missing
mkdir Migrations

# 2. Create initial migration
dotnet ef migrations add InitialCreate

# 3. Apply migrations to database
dotnet ef database update

# 4. View migration history
dotnet ef migrations list

# 5. Revert to previous migration (if needed)
dotnet ef database update PreviousMigrationName
```

---

### Problem: "Port 5217 already in use"

**Solution:**

```bash
# 1. Find process using port
netstat -ano | findstr :5217

# 2. Kill process (Windows - replace PID)
taskkill /PID <PID> /F

# OR change port in launchSettings.json:
# "http": "http://localhost:5002"
```

---

### Problem: Foreign key validation errors

**Cause:** Trying to create child entity with non-existent parent ID

**Solution:**

```bash
# 1. Verify parent entity exists
GET /api/branches/1
GET /api/lessors/1

# 2. Use correct IDs from response
# 3. Ensure IDs are integers, not strings
```

---

### Problem: "Username already exists" error

**Cause:** Attempting to create duplicate username

**Solution:**

```bash
# 1. Check existing users
GET /api/users

# 2. Use unique username
POST /api/users
{
  "username": "unique_username_here",
  ...
}
```

---

### Problem: CORS errors in browser

**Cause:** Frontend on different domain than API

**Solution:** CORS is already enabled in development. For production:

```csharp
// In Program.cs - add specific origins instead of AllowAnyOrigin
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecific", builder =>
    {
        builder.WithOrigins("http://yourdomain.com")
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});
```

---

### Problem: Timestamps showing wrong timezone

**Cause:** DateTime not in UTC

**Solution:** Models already use DateTime.UtcNow:

```csharp
[Column("created_at")]
public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
```

---

### Problem: API returns 500 Internal Server Error

**Cause:** Unhandled exception in controller

**Solution:**

```bash
# 1. Check application logs
# 2. Add error logging middleware
# 3. Use debugger to trace exception
dotnet run --configuration Debug
```

---

### Problem: Cannot find "Microsoft.EntityFrameworkCore"

**Cause:** NuGet packages not restored

**Solution:**

```bash
# 1. Restore packages
dotnet restore

# 2. Clean and rebuild
dotnet clean
dotnet build
```

---

## 📝 Common Commands

### Project Setup

```bash
# Restore dependencies
dotnet restore

# Build project
dotnet build

# Clean build artifacts
dotnet clean

# Rebuild project
dotnet rebuild
```

### Database Migrations

```bash
# Create new migration
dotnet ef migrations add MigrationName

# List all migrations
dotnet ef migrations list

# Update database to latest migration
dotnet ef database update

# Update database to specific migration
dotnet ef database update MigrationName

# Revert last migration
dotnet ef migrations remove

# Generate migration script (without applying)
dotnet ef migrations script -o migration.sql
```

### Running Application

```bash
# Run in default environment
dotnet run

# Run in specific environment
dotnet run --environment Development
dotnet run --environment Production

# Run with hot reload (watch mode)
dotnet watch run

# Run tests
dotnet test

# Publish for deployment
dotnet publish -c Release
```

### Debugging

```bash
# Run with debug information
dotnet run --configuration Debug

# Attach debugger in Visual Studio
# Set breakpoints and press F5

# View application logs
# Check bin/Debug or bin/Release folders
```

---

## 🧪 Testing Commands

### Using cURL

```bash
# Get all branches
curl -X GET http://localhost:5217/api/branches -k

# Create branch
curl -X POST http://localhost:5217/api/branches \
  -H "Content-Type: application/json" \
  -d '{"oracleCode":"BR001","branchName":"Test","status":"Active"}' \
  -k

# Update branch (ID: 1)
curl -X PUT http://localhost:5217/api/branches/1 \
  -H "Content-Type: application/json" \
  -d '{"branchId":1,"branchName":"Updated"}' \
  -k

# Delete branch (ID: 1)
curl -X DELETE http://localhost:5217/api/branches/1 -k
```

### Using PowerShell

```powershell
# Get all branches
$response = Invoke-RestMethod -Uri "http://localhost:5217/api/branches" `
  -Method Get `
  -SkipCertificateCheck

# Create branch
$body = @{
    oracleCode = "BR001"
    branchName = "Main"
    status = "Active"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5217/api/branches" `
  -Method Post `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -SkipCertificateCheck
```

---

## 📊 PostgreSQL Commands

### Connect to Database

```bash
# Connect to PostgreSQL
psql -h localhost -p 5432 -U postgres

# Connect to specific database
psql -h localhost -p 5432 -U postgres -d ifrs_db
```

### Common Queries

```sql
-- List all tables
\dt

-- Describe table structure
\d table_name

-- Query all data
SELECT * FROM branch;
SELECT * FROM lease;
SELECT * FROM lease_payment_schedule;

-- Count records
SELECT COUNT(*) FROM branch;

-- Delete all data (careful!)
TRUNCATE TABLE lease_payment_schedule;
TRUNCATE TABLE lease;
DELETE FROM lessor;
DELETE FROM branch;
DELETE FROM "user";

-- Drop database
DROP DATABASE ifrs_db;

-- Create database
CREATE DATABASE ifrs_db;
```

---

## 📁 File Management

### View Logs

```bash
# View application output
cat bin/Debug/net10.0/logs.txt

# View migration scripts
ls Migrations/
```

### Configuration Files

```bash
# Edit local settings (Development)
code appsettings.Development.json

# Edit production settings
code appsettings.json

# Edit launch settings
code Properties/launchSettings.json
```

---

## 🔐 Security Commands

### Generate Password Hash

```csharp
// In Program.cs or separate utility
using System.Security.Cryptography;
using System.Text;

string HashPassword(string password)
{
    using (var sha256 = SHA256.Create())
    {
        byte[] hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }
}

// Use: string hash = HashPassword("mypassword");
```

---

## 🔍 Verification Checklist

After setup, verify:

- [ ] `dotnet build` completes without errors
- [ ] Database created: `psql -d ifrs_db`
- [ ] Tables exist: `\dt` in psql
- [ ] Migrations applied: `dotnet ef migrations list`
- [ ] API starts: `dotnet run`
- [ ] GET /api/branches returns empty array: `curl http://localhost:5217/api/branches`
- [ ] Can create branch: `POST /api/branches`
- [ ] Can retrieve branch: `GET /api/branches/1`
- [ ] Can update branch: `PUT /api/branches/1`
- [ ] Can delete branch: `DELETE /api/branches/1`

---

## 📞 Getting Help

### Resources

- ASP.NET Core docs: http://docs.microsoft.com/aspnet/
- Entity Framework docs: http://docs.microsoft.com/ef/
- PostgreSQL docs: http://www.postgresql.org/docs/
- NuGet packages: http://www.nuget.org/

### Debugging Steps

1. Check connection string in appsettings.json
2. Verify PostgreSQL is running
3. Check database exists and is accessible
4. Review model annotations match database schema
5. Verify foreign key IDs exist before creation
6. Check API logs for detailed error messages
7. Use browser DevTools to inspect requests
8. Use Postman to test API endpoints

---

## 🚀 Performance Tips

```bash
# Build in Release mode for better performance
dotnet run --configuration Release

# Check query performance
# Enable EF Core logging to see SQL

# Use pagination for large datasets
# Add .Skip().Take() to queries

# Consider caching frequently accessed data
# Use Redis or in-memory cache
```

---

## 📋 Migration Examples

### Create New Migration After Model Change

```bash
# 1. Modify model (e.g., add property to Branch)
# Edit: models/Branch.cs

# 2. Create migration
dotnet ef migrations add AddNewPropertyToBranch

# 3. Review generated migration
# Check: Migrations/[timestamp]_AddNewPropertyToBranch.cs

# 4. Apply to database
dotnet ef database update
```

### Rollback to Previous State

```bash
# 1. Revert migration
dotnet ef migrations remove

# 2. Update database
dotnet ef database update PreviousMigrationName

# 3. Verify state
SELECT * FROM branch;
```

---

## ⚡ Quick Start (Minimum Steps)

```bash
# 1. Restore dependencies
dotnet restore

# 2. Update database connection
# Edit appsettings.json - set correct PostgreSQL connection

# 3. Create and apply migrations
dotnet ef database update

# 4. Run API
dotnet run

# 5. Test in browser or Postman
# GET http://localhost:5217/api/branches
```

---

**Last Updated:** May 15, 2024
**Framework:** ASP.NET Core 10.0
**Database:** PostgreSQL
