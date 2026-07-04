# IFRS API Documentation

## Overview

This is a complete CRUD API for managing IFRS (International Financial Reporting Standards) lease-related data built with ASP.NET Core 10.0 and Entity Framework Core with PostgreSQL.

## Database Schema & Entity Relationships

### Entities

1. **Branch** - Represents company branches
   - One-to-Many with Lease
2. **Lessor** - Represents property lessors
   - One-to-Many with Lease

3. **Lease** - Main lease information
   - Many-to-One with Branch
   - Many-to-One with Lessor
   - One-to-Many with LeasePaymentSchedule

4. **LeasePaymentSchedule** - Annual payment schedules for leases
   - Many-to-One with Lease

5. **User** - System users for authentication
   - No relationships (standalone)

## Entity Relationships Diagram

```
Branch (1) -----> (Many) Lease
Lessor (1) -----> (Many) Lease
Lease (1) -----> (Many) LeasePaymentSchedule
```

## Prerequisites

- .NET 10.0 SDK
- PostgreSQL 13+
- Visual Studio Code or Visual Studio 2022

## Setup Instructions

### 1. Install Dependencies

```bash
cd Backend/IFRS
dotnet restore
```

### 2. Configure Database Connection

Update `appsettings.json` with your PostgreSQL connection string:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=ifrs_db;Username=postgres;Password=password"
}
```

### 3. Create Database and Run Migrations

```bash
# Create migration
dotnet ef migrations add InitialCreate

# Update database
dotnet ef database update
```

### 4. Run the Application

```bash
dotnet run
```

The API will be available at `http://localhost:5217` or `http://localhost:5000`

## API Endpoints

### Authentication

Currently no authentication is implemented. Add JWT or identity providers as needed.

### Branches

#### Get All Branches

```http
GET /api/branches
```

#### Get Branch by ID

```http
GET /api/branches/{id}
```

#### Create Branch

```http
POST /api/branches
Content-Type: application/json

{
  "oracleCode": "BR001",
  "branchName": "Main Branch",
  "lessee": "Company ABC",
  "status": "Active"
}
```

#### Update Branch

```http
PUT /api/branches/{id}
Content-Type: application/json

{
  "branchId": 1,
  "oracleCode": "BR001",
  "branchName": "Main Branch",
  "lessee": "Company ABC",
  "status": "Active"
}
```

#### Delete Branch

```http
DELETE /api/branches/{id}
```

---

### Lessors

#### Get All Lessors

```http
GET /api/lessors
```

#### Get Lessor by ID

```http
GET /api/lessors/{id}
```

#### Create Lessor

```http
POST /api/lessors
Content-Type: application/json

{
  "fullName": "John Doe",
  "nic": "123456789",
  "address": "123 Main Street",
  "bankName": "First National Bank",
  "accountNumber": "98765432"
}
```

#### Update Lessor

```http
PUT /api/lessors/{id}
Content-Type: application/json

{
  "lessorId": 1,
  "fullName": "John Doe",
  "nic": "123456789",
  "address": "123 Main Street",
  "bankName": "First National Bank",
  "accountNumber": "98765432"
}
```

#### Delete Lessor

```http
DELETE /api/lessors/{id}
```

---

### Leases

#### Get All Leases

```http
GET /api/leases
```

Returns all leases with related Branch, Lessor, and PaymentSchedules.

#### Get Lease by ID

```http
GET /api/leases/{id}
```

Returns lease with all related data.

#### Get Leases by Branch

```http
GET /api/leases/branch/{branchId}
```

Returns all leases for a specific branch.

#### Get Leases by Lessor

```http
GET /api/leases/lessor/{lessorId}
```

Returns all leases from a specific lessor.

#### Create Lease

```http
POST /api/leases
Content-Type: application/json

{
  "branchId": 1,
  "lessorId": 1,
  "leaseNo": "LEASE-2024-001",
  "leasePropertyAddress": "789 Property Avenue",
  "sqft": 5000,
  "startDate": "2024-01-01",
  "endDate": "2027-12-31",
  "extensions": "Option to extend for 3 years",
  "numberOfYears": 3,
  "rentAdvance": 50000.00,
  "rentAdvancePeriod": 12,
  "refundableDeposit": 100000.00,
  "noticePeriodMonths": 3,
  "remarks": "Premium location",
  "agreementValue": 2000000.00,
  "leaseStatus": "Active"
}
```

#### Update Lease

```http
PUT /api/leases/{id}
Content-Type: application/json

{
  "leaseId": 1,
  "branchId": 1,
  "lessorId": 1,
  "leaseNo": "LEASE-2024-001",
  "leasePropertyAddress": "789 Property Avenue",
  "sqft": 5000,
  "startDate": "2024-01-01",
  "endDate": "2027-12-31",
  "extensions": "Option to extend for 3 years",
  "numberOfYears": 3,
  "rentAdvance": 50000.00,
  "rentAdvancePeriod": 12,
  "refundableDeposit": 100000.00,
  "noticePeriodMonths": 3,
  "remarks": "Premium location",
  "agreementValue": 2000000.00,
  "leaseStatus": "Active"
}
```

#### Delete Lease

```http
DELETE /api/leases/{id}
```

---

### Lease Payment Schedules

#### Get All Payment Schedules

```http
GET /api/leasepaymentschedules
```

#### Get Payment Schedule by ID

```http
GET /api/leasepaymentschedules/{id}
```

#### Get Payment Schedules by Lease

```http
GET /api/leasepaymentschedules/lease/{leaseId}
```

Returns all payment schedules for a specific lease ordered by lease year.

#### Create Payment Schedule

```http
POST /api/leasepaymentschedules
Content-Type: application/json

{
  "leaseId": 1,
  "leaseYear": 1,
  "grossAmount": 500000.00,
  "paidAmount": 500000.00
}
```

#### Update Payment Schedule

```http
PUT /api/leasepaymentschedules/{id}
Content-Type: application/json

{
  "paymentScheduleId": 1,
  "leaseId": 1,
  "leaseYear": 1,
  "grossAmount": 500000.00,
  "paidAmount": 500000.00
}
```

#### Delete Payment Schedule

```http
DELETE /api/leasepaymentschedules/{id}
```

---

### Users

#### Get All Users

```http
GET /api/users
```

#### Get User by ID

```http
GET /api/users/{id}
```

#### Create User

```http
POST /api/users
Content-Type: application/json

{
  "username": "admin",
  "passwordHash": "hashed_password_here",
  "fullName": "Administrator",
  "email": "admin@ifrs.com",
  "role": "Admin"
}
```

**Note:** Password should be hashed before sending. Never send plain text passwords.

#### Update User

```http
PUT /api/users/{id}
Content-Type: application/json

{
  "userId": 1,
  "username": "admin",
  "fullName": "Administrator",
  "email": "admin@ifrs.com",
  "role": "Admin"
}
```

#### Delete User

```http
DELETE /api/users/{id}
```

---

## Response Format

### Success Response (200 OK)

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

### Error Response (400 Bad Request)

```json
{
  "message": "Branch name is required"
}
```

### Not Found Response (404)

```json
{
  "message": "Branch not found"
}
```

## Error Codes

| Code | Message               | Description                              |
| ---- | --------------------- | ---------------------------------------- |
| 200  | OK                    | Request successful                       |
| 201  | Created               | Resource created successfully            |
| 400  | Bad Request           | Invalid input or missing required fields |
| 404  | Not Found             | Resource not found                       |
| 500  | Internal Server Error | Server error                             |

## Testing

Use the provided `ifrs-api-tests.http` file in VS Code with the REST Client extension to test all endpoints.

### Installation

1. Install REST Client extension in VS Code
2. Open `test/ifrs-api-tests.http`
3. Click "Send Request" above each request to execute

### Complete Workflow Test

Follow the "COMPLETE WORKFLOW EXAMPLE" section in the test file to:

1. Create a Branch
2. Create a Lessor
3. Create a Lease linking Branch and Lessor
4. Create Payment Schedules for the Lease
5. Retrieve full lease details with relationships

## Project Structure

```
IFRS/
├── controllers/
│   ├── BranchesController.cs
│   ├── LessorsController.cs
│   ├── LeasesController.cs
│   ├── LeasePaymentSchedulesController.cs
│   └── UsersController.cs
├── models/
│   ├── Branch.cs
│   ├── Lessor.cs
│   ├── Lease.cs
│   ├── LeasePaymentSchedule.cs
│   └── User.cs
├── Data/
│   └── IFRSDbContext.cs
├── test/
│   └── ifrs-api-tests.http
├── Program.cs
├── IFRS.csproj
├── appsettings.json
└── appsettings.Development.json
```

## Key Features

- ✅ Full CRUD operations for all entities
- ✅ Entity relationships properly configured
- ✅ Foreign key validation
- ✅ Automatic timestamp management (CreatedAt, UpdatedAt)
- ✅ Comprehensive error handling
- ✅ CORS enabled for frontend integration
- ✅ OpenAPI documentation support
- ✅ PostgreSQL database integration

## Future Enhancements

1. **Authentication & Authorization**
   - JWT token-based authentication
   - Role-based access control

2. **Validation**
   - FluentValidation for advanced validation
   - Business logic validation

3. **Pagination**
   - Add pagination support to GET endpoints

4. **Filtering & Sorting**
   - Advanced filtering capabilities
   - Dynamic sorting options

5. **Logging**
   - Implement structured logging (Serilog)
   - Audit trail for changes

6. **Caching**
   - Redis caching for frequently accessed data

7. **API Versioning**
   - Support for multiple API versions

## Database Setup Script

If you need to manually create the database:

```sql
-- Create database
CREATE DATABASE ifrs_db;

-- Run the schema.sql script from Database folder
-- This creates all tables with relationships
```

## Connection String Format

```
Host=<server>;Port=<port>;Database=<database>;Username=<username>;Password=<password>
```

**Example:**

```
Host=localhost;Port=5432;Database=ifrs_db;Username=postgres;Password=password
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly using the HTTP test file
4. Submit a pull request

## License

[Your License Here]

## Support

For issues or questions, please contact the development team.
