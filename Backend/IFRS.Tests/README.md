# IFRS Backend Unit Tests

This folder contains the xUnit test project for the IFRS backend services and controllers. Tests are designed to be fast and deterministic by using EF Core's in-memory provider and small test helpers.

**Prerequisites**

- .NET SDK that supports `net10.0` installed and on your PATH.
- Run `dotnet restore` from the repository root if packages are missing.

**Quick Run**

- Run all tests in the solution:

```bash
dotnet test
```

- Run only the backend test project:

```bash
dotnet test Backend/IFRS.Tests/IFRS.Tests.csproj
```

- Run a single test by name (xUnit filter):

```bash
dotnet test --filter FullyQualifiedName~IFRS.Tests.Services.JwtServiceTests.GenerateRefreshToken
```

**What these tests cover**

- Service layer: `JwtService` and `AuthService` unit tests (uses in-memory DB).
- Controller layer: `BranchesController`, `LessorsController`, and `AuthController` controller tests (direct controller invocation with `DefaultHttpContext`).

Key files:

- Test project: [Backend/IFRS.Tests/IFRS.Tests.csproj](Backend/IFRS.Tests/IFRS.Tests.csproj)
- Test helpers: [Backend/IFRS.Tests/TestHelpers/DbContextFactory.cs](Backend/IFRS.Tests/TestHelpers/DbContextFactory.cs)
- JWT test configuration: [Backend/IFRS.Tests/TestHelpers/ConfigurationFactory.cs](Backend/IFRS.Tests/TestHelpers/ConfigurationFactory.cs)

**Notes & Troubleshooting**

- If you see JWT key size errors (IDX10720), ensure the test signing key in `ConfigurationFactory` is at least 32 bytes for HS256.
- If tests complain about missing packages, run `dotnet restore` and then `dotnet test`.
- The controller tests call controller methods directly and do not start the web host. For end-to-end tests that exercise routing/middleware, consider adding integration tests using `Microsoft.AspNetCore.Mvc.Testing` and `WebApplicationFactory<Program>`.

**Integration tests**

- This project includes an end-to-end integration test that uses `WebApplicationFactory<Program>` and an in-memory EF Core database. The test performs a realistic flow: check setup, register admin, login, attach the real JWT to `HttpClient`, call a protected endpoint to validate the authentication pipeline, create `Branch` and `Lessor`, create a `Lease` referencing them, then fetch the lease and verify details.

- The integration test configures the app environment to `IntegrationTesting` so the test host uses `Newtonsoft.Json` and avoids cookie middleware that the test host cannot serialize. It also replaces the real `IFRSDbContext` with an in-memory DB for isolation.

Example (token usage):

```csharp
var loginData = await loginResp.Content.ReadFromJsonAsync<AuthResponse>();
client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginData!.AccessToken);
```

Run the integration tests (examples):

```bash
dotnet test Backend/IFRS.Tests/IFRS.Tests.csproj --filter FullyQualifiedName~IFRS.Tests.Integration
```

Run the specific end-to-end flow test:

```bash
dotnet test Backend/IFRS.Tests/IFRS.Tests.csproj --filter FullyQualifiedName~IFRS.Tests.Integration.EndToEndIntegrationTests.AdminRegister_Login_CreateBranch_CreateLessor_CreateLease_EndToEnd
```

**CI**

- Use the following command in CI to run tests and collect coverage (example):

```bash
dotnet test Backend/IFRS.Tests/IFRS.Tests.csproj --configuration Release --no-build
```

If you want, I can extend this README with CI examples for GitHub Actions or add integration test scaffolding.
