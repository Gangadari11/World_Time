import { useEffect, useMemo, useState } from "react"
import { Download, Filter, Search } from "lucide-react"

import { getBranches } from "@/api/branches.api"
import { getIfrs16LeaseIndentureSummaryReport } from "@/api/ifrs16-report.api"
import { getLeaseById, getLeasePaymentCashflows } from "@/api/leases.api"
import { enrichIfrs16LeaseSummaryRow } from "@/lib/reporting-calculations"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/useToast"
import type { Branch } from "@/types/branch"
import type {
  Ifrs16LeaseIndentureSummaryRow,
  Ifrs16ReportFilters,
} from "@/types/ifrs16-report"

type FilterState = {
  branchId: string
  leaseStatus: string
  startDateFrom: string
  startDateTo: string
  endDateFrom: string
  endDateTo: string
}

const emptyValue = "-"

const yearLabels = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "6th Year",
] as const

const emptyFilters: FilterState = {
  branchId: "",
  leaseStatus: "Active",
  startDateFrom: "",
  startDateTo: "",
  endDateFrom: "",
  endDateTo: "",
}

export function LeaseIndentureSummaryReport() {
  const { addToast } = useToast()

  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters)
  const [rows, setRows] = useState<Ifrs16LeaseIndentureSummaryRow[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filterCount = useMemo(() => {
    return Object.values(appliedFilters).filter((value) => value.trim().length > 0)
      .length
  }, [appliedFilters])

  useEffect(() => {
    let isActive = true

    async function loadBranches() {
      try {
        const allBranches = await getBranches()
        if (isActive) {
          setBranches(allBranches)
        }
      } catch {
        if (isActive) {
          setBranches([])
        }
      }
    }

    loadBranches()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function loadReportData() {
      setLoading(true)
      setError(null)

      try {
        const result = await getIfrs16LeaseIndentureSummaryReport(
          toApiFilters(appliedFilters),
        )

        if (isActive) {
          setRows(result)

          // enrich rows with actual amounts per year by calling cashflow API
          try {
            const enriched = await Promise.all(
              result.map(async (row) => {
                try {
                  const lease = await getLeaseById(row.leaseId)
                  const cf = await getLeasePaymentCashflows(row.leaseId)
                  return enrichIfrs16LeaseSummaryRow(row, lease, cf?.cashflows ?? [])
                } catch {
                  return row
                }
              }),
            )

            if (isActive) setRows(enriched)
          } catch {
            // swallow; keep original rows
          }
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load the IFRS 16 report."

        if (isActive) {
          setError(message)
          setRows([])
        }

        addToast({
          title: "Unable to load report",
          description: message,
          type: "error",
        })
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadReportData()

    return () => {
      isActive = false
    }
  }, [addToast, appliedFilters])

  function applyFilters() {
    setAppliedFilters(filters)
  }

  function resetFilters() {
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
  }

  function exportToCsv() {
    if (!rows.length) {
      addToast({
        title: "No data to export",
        description: "Apply filters or load data before exporting.",
        type: "error",
      })
      return
    }

    const headers = [
      "Oracle Code",
      "Branch Code",
      "Branch Name",
      "Lessee",
      "Lessor Full Name",
      "Lease No",
      "NIC",
      "Lessor Address",
      "Sqft",
      "Lease Property Address",
      "Start Date",
      "End Date",
      "Extensions",
      "Number of Years",
      "Today",
      "Remaining Period",
      "Scheduled 1st Year",
      "Scheduled 2nd Year",
      "Scheduled 3rd Year",
      "Scheduled 4th Year",
      "Scheduled 5th Year",
      "Scheduled 6th Year",
      "Actual 1st Year",
      "Actual 2nd Year",
      "Actual 3rd Year",
      "Actual 4th Year",
      "Actual 5th Year",
      "Actual 6th Year",
      "Account #",
      "Bank",
      "Utility Bill Payments",
      "Rent Advance",
      "Refundable Deposit",
      "Notice Period Months",
      "Remarks",
      "Rent Advance Period",
      "Required Deduction from Monthly Rental",
      "Agreement Value",
      "Months to Recover Rent Advance",
      "Months Recovered",
      "Balance Months to be Recovered",
      "Rent Advance Recovery per Month",
      "Total Rent Advance Recovery",
      "Total Outstanding Receivable",
    ]

    const lines = rows.map((row) => {
      return [
        row.oracleCode,
        row.branchCode,
        row.branchName,
        row.lessee,
        row.lessorFullName,
        row.leaseNo,
        row.nic,
        row.lessorAddress,
        row.sqft,
        row.leasePropertyAddress,
        row.startDate,
        row.endDate,
        row.extensions,
        row.numberOfYears,
        row.today,
        formatDecimal(row.remainingPeriodYears),
        row.firstYearScheduledAmount,
        row.secondYearScheduledAmount,
        row.thirdYearScheduledAmount,
        row.fourthYearScheduledAmount,
        row.fifthYearScheduledAmount,
        row.sixthYearScheduledAmount,
        row.firstYearActualAmount,
        row.secondYearActualAmount,
        row.thirdYearActualAmount,
        row.fourthYearActualAmount,
        row.fifthYearActualAmount,
        row.sixthYearActualAmount,
        row.accountNumber,
        row.bankName,
        row.utilityBill,
        row.rentAdvance,
        row.refundableDeposit,
        row.noticePeriodMonths,
        row.remarks,
        row.rentAdvancePeriod,
        row.requiredDeductionFromMonthlyRental,
        row.agreementValue,
        row.monthsToRecoverRentAdvance,
        row.monthsRecovered,
        row.balanceMonthsToBeRecovered,
        row.rentAdvanceRecoveryPerMonth,
        row.totalRentAdvanceRecovery,
        row.totalOutstandingReceivable,
      ].map(toCsvCell)
    })

    const csvContent = [headers.map(toCsvCell), ...lines]
      .map((line) => line.join(","))
      .join("\n")

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    })

    const fileName = `ifrs16-summary-of-lease-indentures-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`

    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")

    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    window.URL.revokeObjectURL(url)

    addToast({
      title: "Export complete",
      description: "Report downloaded as an Excel-compatible CSV file.",
      type: "success",
    })
  }

  const showTerminationColumns =
    appliedFilters.leaseStatus?.toLowerCase() === "terminate"

  return (
    <section className="mx-auto w-full max-w-[96rem] space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Summary of Lease Indentures
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and export lease-indenture reporting with branch, lessor,
            and lease details.
          </p>
        </div>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={exportToCsv}
          disabled={loading || rows.length === 0}
        >
          <Download className="size-4" />
          Export to Excel
        </Button>
      </header>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium">
          <Filter className="size-4 text-muted-foreground" />
          Filters
          <span className="text-xs text-muted-foreground">
            ({filterCount} applied)
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Branch
            <select
              value={filters.branchId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  branchId: event.target.value,
                }))
              }
              className="h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground"
            >
              <option value="">All branches</option>
              {branches.map((branch) => (
                <option key={branch.branchId} value={String(branch.branchId)}>
                  {branch.oracleCode} - {branch.branchName}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Lease Status
            <select
              value={filters.leaseStatus}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  leaseStatus: event.target.value,
                }))
              }
              className="h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground"
            >
              <option value="Active">Active</option>
              <option value="Terminate">Terminate</option>
            </select>
          </label>

          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Start Date From
            <input
              type="date"
              value={filters.startDateFrom}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  startDateFrom: event.target.value,
                }))
              }
              className="h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Start Date To
            <input
              type="date"
              value={filters.startDateTo}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  startDateTo: event.target.value,
                }))
              }
              className="h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            End Date From
            <input
              type="date"
              value={filters.endDateFrom}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  endDateFrom: event.target.value,
                }))
              }
              className="h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            End Date To
            <input
              type="date"
              value={filters.endDateTo}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  endDateTo: event.target.value,
                }))
              }
              className="h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button className="cursor-pointer" onClick={applyFilters}>
            <Search className="size-4" />
            Apply Filters
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={resetFilters}
            disabled={loading}
          >
            Reset
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-[2700px] text-sm">
            <thead className="bg-black/80 text-xs uppercase text-muted-foreground text-white/90">
              <tr>
                <th rowSpan={2} className="sticky left-0 z-10 border-b  px-3 py-3 text-left">
                  Oracle Code
                </th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Branch Code</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Branch Name</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Lessee</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Lessor Full Name</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Lease No</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">NIC</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Lessor Address</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Sqft</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Lease Property Address</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Start Date</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">End Date</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Extensions</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Number of Years</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Today</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Remaining Period</th>
                <th colSpan={6} className="border-b border-l px-3 py-2 text-center">
                  Scheduled/Original Amount per Year
                </th>
                <th colSpan={6} className="border-b border-l px-3 py-2 text-center">
                  Actual Amount Paid/To Be Paid per Year
                </th>
                <th rowSpan={2} className="border-b border-l px-3 py-3 text-left">Account #</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Bank</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Utility Bill Payments</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Rent Advance</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Refundable Deposit</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Notice Period Months</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Remarks</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Rent Advance Period</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Calc: Required Deduction from Monthly Rental</th>
                <th rowSpan={2} className="border-b px-3 py-3 text-left">Agreement Value</th>
                {showTerminationColumns && (
                  <th colSpan={6} className="border-b border-l px-3 py-2 text-center">
                    Termination — Outstanding Receivable
                  </th>
                )}
              </tr>
              <tr>
                {yearLabels.map((label) => (
                  <th key={`scheduled-${label}`} className="border-b border-l px-3 py-2 text-left">
                    {label}
                  </th>
                ))}
                {yearLabels.map((label) => (
                  <th key={`actual-${label}`} className="border-b border-l px-3 py-2 text-left">
                    {label}
                  </th>
                ))}
                {showTerminationColumns && (
                  <>
                    <th className="border-b border-l px-3 py-2 text-left">Months to Recover Rent Advance</th>
                    <th className="border-b border-l px-3 py-2 text-left">Months Recovered</th>
                    <th className="border-b border-l px-3 py-2 text-left">Balance Months to be Recovered</th>
                    <th className="border-b border-l px-3 py-2 text-left">Rent Advance Recovery per Month</th>
                    <th className="border-b border-l px-3 py-2 text-left">Total Rent Advance Recovery</th>
                    <th className="border-b border-l px-3 py-2 text-left">Total Outstanding Receivable</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={showTerminationColumns ? 43 : 37}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    Loading report data...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={showTerminationColumns ? 43 : 37}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No lease records found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.leaseId} className="hover:bg-muted/40">
                    <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium">
                      {displayValue(row.oracleCode)}
                    </td>
                    <td className="px-3 py-2">{displayValue(row.branchCode)}</td>
                    <td className="px-3 py-2">{displayValue(row.branchName)}</td>
                    <td className="px-3 py-2">{displayValue(row.lessee)}</td>
                    <td className="px-3 py-2">{displayValue(row.lessorFullName)}</td>
                    <td className="px-3 py-2">{displayValue(row.leaseNo)}</td>
                    <td className="px-3 py-2">{displayValue(row.nic)}</td>
                    <td className="px-3 py-2">{displayValue(row.lessorAddress)}</td>
                    <td className="px-3 py-2">{displayValue(row.sqft)}</td>
                    <td className="px-3 py-2">
                      {displayValue(row.leasePropertyAddress)}
                    </td>
                    <td className="px-3 py-2">{displayValue(row.startDate)}</td>
                    <td className="px-3 py-2">{displayValue(row.endDate)}</td>
                    <td className="px-3 py-2">{displayValue(row.extensions)}</td>
                    <td className="px-3 py-2">{displayValue(row.numberOfYears)}</td>
                    <td className="px-3 py-2">{displayValue(row.today)}</td>
                    <td className="px-3 py-2">{displayValue(formatDecimal(row.remainingPeriodYears))}</td>
                    <td className="border-l px-3 py-2">
                      {displayValue(formatCurrency(row.firstYearScheduledAmount))}
                    </td>
                    <td className="border-l px-3 py-2">
                      {displayValue(formatCurrency(row.secondYearScheduledAmount))}
                    </td>
                    <td className="border-l px-3 py-2">
                      {displayValue(formatCurrency(row.thirdYearScheduledAmount))}
                    </td>
                    <td className="border-l px-3 py-2">
                      {displayValue(formatCurrency(row.fourthYearScheduledAmount))}
                    </td>
                    <td className="border-l px-3 py-2">
                      {displayValue(formatCurrency(row.fifthYearScheduledAmount))}
                    </td>
                    <td className="border-l px-3 py-2">
                      {displayValue(formatCurrency(row.sixthYearScheduledAmount))}
                    </td>
                    <td className="border-l px-3 py-2">
                      {displayValue(formatCurrency(row.firstYearActualAmount))}
                    </td>
                    <td className="border-l px-3 py-2">
                      {displayValue(formatCurrency(row.secondYearActualAmount))}
                    </td>
                    <td className="border-l px-3 py-2">
                      {displayValue(formatCurrency(row.thirdYearActualAmount))}
                    </td>
                    <td className="border-l px-3 py-2">
                      {displayValue(formatCurrency(row.fourthYearActualAmount))}
                    </td>
                    <td className="border-l px-3 py-2">
                      {displayValue(formatCurrency(row.fifthYearActualAmount))}
                    </td>
                    <td className="border-l px-3 py-2">
                      {displayValue(formatCurrency(row.sixthYearActualAmount))}
                    </td>
                    <td className="border-l px-3 py-2">{displayValue(row.accountNumber)}</td>
                    <td className="px-3 py-2">{displayValue(row.bankName)}</td>
                    <td className="px-3 py-2">
                      {displayValue(formatCurrency(row.utilityBill))}
                    </td>
                    <td className="px-3 py-2">
                      {displayValue(formatCurrency(row.rentAdvance))}
                    </td>
                    <td className="px-3 py-2">
                      {displayValue(formatCurrency(row.refundableDeposit))}
                    </td>
                    <td className="px-3 py-2">
                      {displayValue(row.noticePeriodMonths)}
                    </td>
                    <td className="px-3 py-2">{displayValue(row.remarks)}</td>
                    <td className="px-3 py-2">{displayValue(row.rentAdvancePeriod)}</td>
                    <td className="px-3 py-2">
                      {displayValue(
                        formatCurrency(row.requiredDeductionFromMonthlyRental),
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {displayValue(formatCurrency(row.agreementValue))}
                    </td>
                    {showTerminationColumns && (
                      <>
                        <td className="px-3 py-2">{displayValue(row.monthsToRecoverRentAdvance)}</td>
                        <td className="px-3 py-2">{displayValue(row.monthsRecovered)}</td>
                        <td className="px-3 py-2">{displayValue(row.balanceMonthsToBeRecovered)}</td>
                        <td className="px-3 py-2">{displayValue(formatCurrency(row.rentAdvanceRecoveryPerMonth))}</td>
                        <td className="px-3 py-2">{displayValue(formatCurrency(row.totalRentAdvanceRecovery))}</td>
                        <td className="px-3 py-2">{displayValue(formatCurrency(row.totalOutstandingReceivable))}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function toApiFilters(state: FilterState): Ifrs16ReportFilters {
  const result: Ifrs16ReportFilters = {}

  if (state.branchId.trim()) {
    const branchId = Number(state.branchId)
    if (!Number.isNaN(branchId)) {
      result.branchId = branchId
    }
  }

  if (state.leaseStatus.trim()) {
    result.leaseStatus = state.leaseStatus.trim()
  }

  if (state.startDateFrom) {
    result.startDateFrom = state.startDateFrom
  }

  if (state.startDateTo) {
    result.startDateTo = state.startDateTo
  }

  if (state.endDateFrom) {
    result.endDateFrom = state.endDateFrom
  }

  if (state.endDateTo) {
    result.endDateTo = state.endDateTo
  }

  return result
}

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return emptyValue
  }

  return String(value)
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDecimal(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null
  }

  return value.toFixed(2)
}

function toCsvCell(value: unknown) {
  if (value === null || value === undefined) {
    return ""
  }

  const stringValue = String(value).replace(/"/g, '""')
  return `"${stringValue}"`
}
