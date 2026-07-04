import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DashboardPage } from "@/pages/dashboard-page"

vi.mock("@/hooks/useDashboard", () => ({
  useDashboard: () => ({
    loading: false,
    error: null,
    summary: {
      totalActiveLeases: 5,
      totalAgreementValue: 125000,
      averageRentPerSqft: 250,
    },
    distribution: {
      "0-1": 1,
      "1-3": 2,
      "3-5": 1,
      "5+": 1,
    },
    expirations: {
      count30: 1,
      count90: 2,
      count365: 3,
      items: [
        { leaseId: 1, leaseNo: "L-001", branch: { branchName: "Main Branch" }, endDate: "2026-12-31" },
      ],
    },
    topLessors: [
      { lessor: "Lessor A", totalAgreementValue: 70000 },
      { lessor: "Lessor B", totalAgreementValue: 55000 },
    ],
    branches: [
      { branchId: 1, branchName: "Main Branch", leasesCount: 3, agreementSum: 90000, monthlyExpected: 7500, overdue: 1000 },
    ],
  }),
}))

describe("DashboardPage", () => {
  it("renders key dashboard widgets from loaded data", () => {
    render(<DashboardPage />)

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("Total Active Leases")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("Top Lessors")).toBeInTheDocument()
    expect(screen.getByText("Remaining Term Distribution")).toBeInTheDocument()
    expect(screen.getByText("Upcoming Expirations")).toBeInTheDocument()
    expect(screen.getByText("Branch Summary")).toBeInTheDocument()
    expect(screen.getByText("Lessor A")).toBeInTheDocument()
    expect(screen.getByText("L-001")).toBeInTheDocument()
  })
})
