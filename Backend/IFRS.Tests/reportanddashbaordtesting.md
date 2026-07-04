# Report and Dashboard Testing Guide

This document explains:

1. How testing was already implemented in this repository.
2. What new tests were added for Dashboard and IFRS-16 Reporting.
3. How the new tests map to existing testing conventions.
4. How test execution is wired to merge workflows.
5. Why these additions do not change existing production behavior.

## 1) Existing Testing Approach in This System

The project already had a layered test strategy in Backend/IFRS.Tests:

- Controller unit-style tests (direct controller invocation with in-memory EF Core DB).
- Service unit tests (pure service logic and support behavior).
- Integration tests (WebApplicationFactory<Program>, in-memory DB override, real HTTP calls).

### Existing test structure

- Controllers:
  - Controllers/AuthControllerTests.cs
  - Controllers/BranchesControllerTests.cs
  - Controllers/LessorsControllerTests.cs
- Services:
  - Services/AuthServiceTests.cs
  - Services/CashflowServiceTests.cs
  - Services/JwtServiceTests.cs
- Integration:
  - Integration/EndToEndIntegrationTests.cs
  - Integration/LeaseCashflowIntegrationTests.cs
- Helpers:
  - TestHelpers/DbContextFactory.cs
  - TestHelpers/ConfigurationFactory.cs
  - TestHelpers/HostingEnvironmentStub.cs

### Existing style and conventions followed

The existing conventions are:

- xUnit test framework.
- Per-test isolated in-memory database instances.
- Small, deterministic seed data.
- Clear scenario-based test names.
- Assert only business outcomes (status/object shape/calculated values).
- No mutation of production code paths specifically for testing.

The new tests were implemented with this same style.

## 2) New Tests Added

## Backend controller tests

### File: Controllers/DashboardControllerTests.cs

Covers new dashboard metric endpoints with direct controller invocation:

- Summary_ReturnsExpectedActiveLeaseTotals
  - Verifies:
    - Total Active Leases
    - Total Agreement Value (active only)
    - Average Rent per Sqft
- RemainingTermDistribution_ReturnsExpectedBuckets
  - Verifies 4 histogram buckets:
    - 0-1
    - 1-3
    - 3-5
    - 5+
- UpcomingExpirations_ReturnsExpectedWindowCounts
  - Verifies counts for 30/90/365-day windows and item list.
- TopLessors_ReturnsSortedByAgreementValue
  - Verifies ordering and value aggregation for lessors.
- BranchSummary_ReturnsPerBranchMetrics
  - Verifies per-branch KPIs:
    - lease count
    - total agreement value
    - monthly expected
    - overdue

### File: Controllers/LeasesIfrs16ReportingTests.cs

Covers the IFRS-16 reporting API behavior:

- Ifrs16Report_MapsLeaseYearColumnsCorrectly
  - Verifies lease_year to column mapping for scheduled and actual amounts:
    - Year 1 -> firstYearScheduledAmount / firstYearActualAmount
    - Year 2 -> secondYear...
    - Year 3 -> thirdYear...
  - Verifies columns beyond number_of_years remain null.
  - Verifies RequiredDeductionFromMonthlyRental calculation.
- Ifrs16Report_AppliesLeaseStatusFilter
  - Verifies filtering by LeaseStatus returns only matching leases.

## Backend integration tests

### File: Integration/ReportingAndDashboardIntegrationTests.cs

Covers end-to-end API behavior through HTTP pipeline with WebApplicationFactory:

- Dashboard_And_Ifrs16Report_Endpoints_ReturnExpectedResponses
  - Calls:
    - /api/dashboard/summary
    - /api/dashboard/top-lessors
    - /api/dashboard/branch-summary
    - /api/leases/ifrs16-report?leaseStatus=Active
  - Verifies returned status codes and core payload values.

This is consistent with existing integration testing style already used in this project.

## Frontend page tests

Because the request explicitly asked for dashboard and IFRS-16-reporting pages, page-level tests were added in Frontend using existing available dependencies (Vitest + Testing Library).

### File: Frontend/src/pages/dashboard-page.test.tsx

- Mocks useDashboard hook.
- Renders page.
- Verifies visible dashboard widgets and key data rows.

### File: Frontend/src/pages/ifrs16-reporting-page.test.tsx

- Mocks:
  - getBranches
  - getIfrs16LeaseIndentureSummaryReport
  - useToast
- Renders page.
- Waits for async loading completion.
- Verifies report title and row fields are rendered.

## Supporting frontend test setup

- Frontend/package.json:
  - Added script: test = vitest run
- Frontend/vite.config.ts:
  - Added test configuration for jsdom and setup file.
- Frontend/src/test/setup.ts:
  - Loads @testing-library/jest-dom/vitest.
- Added missing dev dependency:
  - @testing-library/dom

These changes are only test infrastructure changes and do not modify runtime application behavior in production.

## 3) How New Tests Map to Existing Tests

The mapping is direct and aligned:

- Existing controller tests -> new controller tests for dashboard/reporting endpoints.
- Existing integration tests -> new integration test validating API route behavior for dashboard/reporting.
- Existing approach of isolated DB seeding -> preserved exactly.

Conceptual map:

- BranchesControllerTests / LessorsControllerTests
  -> DashboardControllerTests (same direct controller + in-memory style)
- LeaseCashflowIntegrationTests / EndToEndIntegrationTests
  -> ReportingAndDashboardIntegrationTests (same WebApplicationFactory + HTTP style)
- Existing frontend had test dependencies but no page tests
  -> added page tests for the two requested pages only.

## 4) Merge Workflow and CI Considerations

Existing workflow file:

- .github/workflows/dotnet-tests.yml

Updates made so merge-time testing includes new scope:

- Updated .NET SDK setup from 9.0.x to 10.0.x to match target framework net10.0.
- Kept backend test job behavior.
- Added frontend-test job:
  - npm ci in Frontend
  - npm test in Frontend

Result:

- On push to main/unittest and PR to main, backend and frontend tests are now both checked.
- Dashboard and IFRS-16 page tests are included in CI checks.

## 5) Safety: Why Existing Flows Are Not Affected

No production business logic was changed for this test task.

Changes are limited to:

- New test files.
- Frontend test setup/config/scripts.
- CI workflow to execute tests for both stacks.

No changes were made to:

- existing endpoint contracts
- existing service logic
- existing DB schema
- existing runtime routes

Therefore existing runtime flows remain unchanged.

## 6) How to Run the Tests Locally

### Backend tests

From repository root:

```powershell
Set-Location D:\Projects\IFRS\Backend\IFRS.Tests
dotnet test --no-restore -clp:Summary
```

### Frontend tests

From repository root:

```powershell
Set-Location D:\Projects\IFRS\Frontend
npm test
```

## 7) Validation Result for This Change

- Frontend tests passed:
  - 2 test files, 2 tests passed.
- Backend tests passed:
  - Total: 28, Failed: 0, Succeeded: 28.

Known warning observed:

- NuGet warning NU1903 for Microsoft.Extensions.Caching.Memory 8.0.0 vulnerability advisory.
- This warning pre-existed in dependency tree and is not introduced by test additions.
