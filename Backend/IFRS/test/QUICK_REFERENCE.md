# IFRS API - Quick Reference Guide

## Project Summary

Complete CRUD REST API for IFRS Lease Management built with ASP.NET Core 10.0, Entity Framework Core, and PostgreSQL.

---

## 📁 Project Structure

```
Backend/IFRS/
├── models/                          # Data models
│   ├── Branch.cs
│   ├── Lessor.cs
│   ├── Lease.cs
│   ├── LeasePaymentSchedule.cs
│   └── User.cs
├── controllers/                     # API controllers
│   ├── BranchesController.cs
│   ├── LessorsController.cs
│   ├── LeasesController.cs
│   ├── LeasePaymentSchedulesController.cs
│   └── UsersController.cs
├── Data/                            # Database context
│   └── IFRSDbContext.cs
├── test/                            # Testing files
│   ├── ifrs-api-tests.http         # REST Client tests
│   ├── API_DOCUMENTATION.md        # Full API docs
│   └── IFRS-API-Collection.postman_collection.json
├── Program.cs                       # Application entry point
├── IFRS.csproj                      # Project file
├── appsettings.json                # Configuration
└── Properties/launchSettings.json   # Launch configuration
```

---

## 🚀 Quick Start

### 1. Prerequisites

- .NET 10.0 SDK
- PostgreSQL 13+
- VS Code or Visual Studio 2022

### 2. Clone & Setup

```bash
cd Backend/IFRS
dotnet restore
```

### 3. Configure Database

Edit `appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=ifrs_db;Username=postgres;Password=password"
}
```

### 4. Create Database

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 5. Run Application

```bash
dotnet run
```

API runs at: `http://localhost:5217`

---

## 📊 Entity Relationships

```
┌─────────┐         ┌───────┐         ┌─────────────────────┐
│ Branch  │────┬───>│ Lease │<───┬───│ LeasePaymentSchedule│
└─────────┘    │    └───────┘    │   └─────────────────────┘
               │                 │
             1:N               1:N
               │                 │
               └─────────┬───────┘
                         │
                    ┌────┴─────┐
                    │           │
                  ┌─┴──┐    ┌─────┴──┐
                  │ FK │    │  FK    │
           BranchId    LessorId
                       (Optional)

User (Standalone)
```

### Relationships Summary

| Entity               | Relationship | Target               | Cardinality |
| -------------------- | ------------ | -------------------- | ----------- |
| Branch               | Has Many     | Lease                | 1:N         |
| Lessor               | Has Many     | Lease                | 1:N         |
| Lease                | Has Many     | LeasePaymentSchedule | 1:N         |
| LeasePaymentSchedule | Belongs To   | Lease                | N:1         |

---

## 🔌 API Endpoints

### Base URL

```
http://localhost:5217/api
```

### Branches

| Method | Endpoint         | Purpose           |
| ------ | ---------------- | ----------------- |
| GET    | `/branches`      | Get all branches  |
| GET    | `/branches/{id}` | Get branch by ID  |
| POST   | `/branches`      | Create new branch |
| PUT    | `/branches/{id}` | Update branch     |
| DELETE | `/branches/{id}` | Delete branch     |

### Lessors

| Method | Endpoint        | Purpose           |
| ------ | --------------- | ----------------- |
| GET    | `/lessors`      | Get all lessors   |
| GET    | `/lessors/{id}` | Get lessor by ID  |
| POST   | `/lessors`      | Create new lessor |
| PUT    | `/lessors/{id}` | Update lessor     |
| DELETE | `/lessors/{id}` | Delete lessor     |

### Leases

| Method | Endpoint                    | Purpose              |
| ------ | --------------------------- | -------------------- |
| GET    | `/leases`                   | Get all leases       |
| GET    | `/leases/{id}`              | Get lease by ID      |
| GET    | `/leases/branch/{branchId}` | Get leases by branch |
| GET    | `/leases/lessor/{lessorId}` | Get leases by lessor |
| POST   | `/leases`                   | Create new lease     |
| PUT    | `/leases/{id}`              | Update lease         |
| DELETE | `/leases/{id}`              | Delete lease         |

### Lease Payment Schedules

| Method | Endpoint                                 | Purpose                |
| ------ | ---------------------------------------- | ---------------------- |
| GET    | `/leasepaymentschedules`                 | Get all schedules      |
| GET    | `/leasepaymentschedules/{id}`            | Get schedule by ID     |
| GET    | `/leasepaymentschedules/lease/{leaseId}` | Get schedules by lease |
| POST   | `/leasepaymentschedules`                 | Create new schedule    |
| PUT    | `/leasepaymentschedules/{id}`            | Update schedule        |
| DELETE | `/leasepaymentschedules/{id}`            | Delete schedule        |

### Users

| Method | Endpoint      | Purpose         |
| ------ | ------------- | --------------- |
| GET    | `/users`      | Get all users   |
| GET    | `/users/{id}` | Get user by ID  |
| POST   | `/users`      | Create new user |
| PUT    | `/users/{id}` | Update user     |
| DELETE | `/users/{id}` | Delete user     |

---

## 📝 Request/Response Examples

### Create Branch

**Request:**

```http
POST http://localhost:5217/api/branches
Content-Type: application/json

{
  "oracleCode": "BR001",
  "branchName": "Main Branch",
  "lessee": "Company ABC",
  "status": "Active"
}
```

**Response (201 Created):**

```json
{
  "branchId": 1,
  "oracleCode": "BR001",
  "branchName": "Main Branch",
  "lessee": "Company ABC",
  "status": "Active",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "leases": []
}
```

### Create Lease

**Request:**

```http
POST http://localhost:5217/api/leases
Content-Type: application/json

{
  "branchId": 1,
  "lessorId": 1,
  "leaseNo": "LEASE-2024-001",
  "leasePropertyAddress": "789 Property Avenue",
  "sqft": 5000,
  "startDate": "2024-01-01",
  "endDate": "2027-12-31",
  "numberOfYears": 3,
  "rentAdvance": 50000.00,
  "refundableDeposit": 100000.00,
  "agreementValue": 2000000.00,
  "leaseStatus": "Active"
}
```

### Create Payment Schedule

**Request:**

```http
POST http://localhost:5217/api/leasepaymentschedules
Content-Type: application/json

{
  "leaseId": 1,
  "leaseYear": 1,
  "grossAmount": 500000.00,
  "paidAmount": 500000.00
}
```

---

## ✔️ Validation Rules

### Branch

- `BranchName` - Required, max 255 chars

### Lessor

- `FullName` - Required, max 255 chars

### Lease

- `BranchId` - Must reference valid branch
- `LessorId` - Must reference valid lessor
- Foreign keys are validated before creation/update

### LeasePaymentSchedule

- `LeaseId` - Must reference valid lease
- `GrossAmount` - Required, must be non-negative

### User

- `Username` - Required, unique, max 255 chars
- `PasswordHash` - Required, max 255 chars
- Cannot duplicate usernames

---

## 🧪 Testing

### VS Code REST Client

1. Install "REST Client" extension
2. Open `test/ifrs-api-tests.http`
3. Click "Send Request" on any request
4. Results appear in output panel

### Postman

1. Import `test/IFRS-API-Collection.postman_collection.json`
2. Set base URL: `http://localhost:5217`
3. Click "Send" on any request

### cURL Examples

```bash
# Get all branches
curl -X GET http://localhost:5217/api/branches \
  -H "Content-Type: application/json" \
  -k  # For local development with self-signed cert

# Create branch
curl -X POST http://localhost:5217/api/branches \
  -H "Content-Type: application/json" \
  -d '{"oracleCode":"BR001","branchName":"Main","status":"Active"}' \
  -k
```

---

## 📦 NuGet Packages

| Package                               | Version | Purpose             |
| ------------------------------------- | ------- | ------------------- |
| Microsoft.AspNetCore.OpenApi          | 10.0.7  | OpenAPI support     |
| Microsoft.EntityFrameworkCore         | 8.0.0   | ORM                 |
| Npgsql.EntityFrameworkCore.PostgreSQL | 8.0.0   | PostgreSQL provider |
| Microsoft.EntityFrameworkCore.Tools   | 8.0.0   | EF Core tools       |

---

## 🔐 Security Considerations

- **Authentication:** Not implemented - add JWT tokens
- **Authorization:** Not implemented - add role-based access
- **Password:** Should be hashed before storage (never send plain text)
- **CORS:** Enabled for all origins in development (restrict in production)
- **http:** Required in production

---

## 🛠️ Common Issues & Solutions

### Issue: Connection refused

**Solution:** Ensure PostgreSQL is running and connection string is correct

### Issue: Migrations not found

**Solution:** Run `dotnet ef migrations add InitialCreate`

### Issue: Port already in use

**Solution:** Update `launchSettings.json` to use different port

### Issue: Foreign key validation fails

**Solution:** Ensure referenced entity exists before creating child entity

---

## 📚 File Descriptions

| File                   | Purpose                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `Program.cs`           | App configuration, DbContext registration, middleware setup |
| `IFRSDbContext.cs`     | EF Core DbContext with relationship mappings                |
| `*Controller.cs`       | CRUD endpoints for each entity                              |
| `*.cs` (models)        | Entity definitions with annotations                         |
| `ifrs-api-tests.http`  | Test requests for VS Code REST Client                       |
| `API_DOCUMENTATION.md` | Detailed API reference                                      |

---

## 🔄 Complete Workflow Example

1. **Create Branch**

   ```http
   POST /api/branches
   → Response: branchId = 1
   ```

2. **Create Lessor**

   ```http
   POST /api/lessors
   → Response: lessorId = 1
   ```

3. **Create Lease** (link branch & lessor)

   ```http
   POST /api/leases
   Body: { branchId: 1, lessorId: 1, ... }
   → Response: leaseId = 1
   ```

4. **Create Payment Schedules** (for lease)

   ```http
   POST /api/leasepaymentschedules
   Body: { leaseId: 1, leaseYear: 1, ... }
   → Response: paymentScheduleId = 1
   ```

5. **Retrieve Full Details**
   ```http
   GET /api/leases/1
   → Response includes Branch, Lessor, and PaymentSchedules
   ```

---

## 📞 Support & Documentation

- Full API docs: `test/API_DOCUMENTATION.md`
- Test examples: `test/ifrs-api-tests.http`
- Postman collection: `test/IFRS-API-Collection.postman_collection.json`

---

## ✨ Features Implemented

✅ Full CRUD for all entities
✅ Proper entity relationships (1:N, N:1)
✅ Foreign key validation
✅ Automatic timestamps (CreatedAt, UpdatedAt)
✅ Error handling with descriptive messages
✅ Data annotations and column mapping
✅ DbContext with relationship configuration
✅ CORS enabled for development
✅ OpenAPI ready
✅ PostgreSQL integration

---

## 🚀 Next Steps

1. Add authentication (JWT)
2. Add authorization (role-based)
3. Implement pagination
4. Add advanced filtering/sorting
5. Add logging (Serilog)
6. Add caching (Redis)
7. Add API versioning
8. Add unit tests
9. Add input validation (FluentValidation)
10. Add audit logging

---

**Last Updated:** May 15, 2024
**Framework:** ASP.NET Core 10.0
**Database:** PostgreSQL
**ORM:** Entity Framework Core 8.0
