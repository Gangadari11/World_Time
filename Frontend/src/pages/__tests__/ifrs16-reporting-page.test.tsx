import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { LeaseIndentureSummaryReport } from "@/components/ifrs16-reporting/lease-indenture-summary-report"

const addToast = vi.fn()

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ addToast }),
}))

const getBranchesMock = vi.fn(async () => [
  {
    branchId: 1,
    oracleCode: "ORC-01",
    branchName: "Main Branch",
    lessee: "Lessee A",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    leases: [],
  },
])

const getReportMock = vi.fn(async () => [
  {
    leaseId: 1,
    oracleCode: "ORC-01",
    branchName: "Main Branch",
    lessee: "Lessee A",
    lessorFullName: "Lessor A",
    leaseNo: "LEASE-001",
    nic: "123456789V",
    lessorAddress: "Address 1",
    sqft: 1000,
    leasePropertyAddress: "Property 1",
    startDate: "2026-01-01",
    endDate: "2028-12-31",
    extensions: "None",
    numberOfYears: 3,
    today: "2026-05-22",
    remainingPeriodYears: 2.5,
    firstYearScheduledAmount: 1000,
    secondYearScheduledAmount: 2000,
    thirdYearScheduledAmount: 3000,
    fourthYearScheduledAmount: null,
    fifthYearScheduledAmount: null,
    sixthYearScheduledAmount: null,
    firstYearActualAmount: 900,
    secondYearActualAmount: 1900,
    thirdYearActualAmount: 2800,
    fourthYearActualAmount: null,
    fifthYearActualAmount: null,
    sixthYearActualAmount: null,
    accountNumber: "111222333",
    bankName: "Test Bank",
    utilityBill: 250,
    rentAdvance: 1200,
    refundableDeposit: 500,
    noticePeriodMonths: 3,
    remarks: "sample",
    rentAdvancePeriod: 12,
    requiredDeductionFromMonthlyRental: 100,
    agreementValue: 6000,
    leaseStatus: "Active",
    monthsToRecoverRentAdvance: null,
    monthsRecovered: null,
    balanceMonthsToBeRecovered: null,
    rentAdvanceRecoveryPerMonth: null,
    totalRentAdvanceRecovery: null,
    totalOutstandingReceivable: null,
  },
])

vi.mock("@/api/branches.api", () => ({
  getBranches: () => getBranchesMock(),
}))

vi.mock("@/api/ifrs16-report.api", () => ({
  getIfrs16LeaseIndentureSummaryReport: () => getReportMock(),
}))

vi.mock("@/api/leases.api", () => ({
  getLeasePaymentCashflows: async (_id: number) => ({
    cashflows: [
      { leaseYear: 1, netCashFlow: 900 },
      { leaseYear: 2, netCashFlow: 1900 },
      { leaseYear: 3, netCashFlow: 2800 },
    ],
  }),
}))

describe("LeaseIndentureSummaryReport", () => {
  it("loads and renders report table rows", async () => {
    render(<LeaseIndentureSummaryReport />)

    expect(screen.getByText("Summary of Lease Indentures")).toBeInTheDocument()

    await waitFor(() => {
      expect(getBranchesMock).toHaveBeenCalledTimes(1)
      expect(getReportMock).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByText("LEASE-001")).toBeInTheDocument()
    expect(screen.getByText("Lessor A")).toBeInTheDocument()
    expect(screen.getByText("Main Branch")).toBeInTheDocument()
    expect(addToast).not.toHaveBeenCalled()
  })
})
