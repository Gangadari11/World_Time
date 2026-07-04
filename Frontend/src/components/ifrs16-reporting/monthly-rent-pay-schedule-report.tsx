import { useEffect, useMemo, useState } from "react"
import { Download, Filter, Search } from "lucide-react"

import { getBranches } from "@/api/branches.api"
import { getLeases, getLeasePaymentCashflows } from "@/api/leases.api"
import { buildMonthlyRentPayScheduleRows } from "@/lib/reporting-calculations"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/useToast"
import type { Branch } from "@/types/branch"
import type { Lease } from "@/types/lease"
import type { MonthlyRentPayScheduleRow } from "@/types/monthly-rent-pay-schedule"

type FilterState = {
  branchId: string
  leaseStatus: string
  startDateFrom: string
  startDateTo: string
  endDateFrom: string
  endDateTo: string
}

const emptyValue = "-"

const emptyFilters: FilterState = {
  branchId: "",
  leaseStatus: "Active",
  startDateFrom: "",
  startDateTo: "",
  endDateFrom: "",
  endDateTo: "",
}

export function MonthlyRentPayScheduleReport() {
  const { addToast } = useToast()

  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters)
  const [rows, setRows] = useState<MonthlyRentPayScheduleRow[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rowsPerPage = 12

  const filterCount = useMemo(() => {
    return Object.values(appliedFilters).filter((value) => value.trim().length > 0)
      .length
  }, [appliedFilters])

  const totalPages = Math.max(Math.ceil(rows.length / rowsPerPage), 1)
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return rows.slice(startIndex, startIndex + rowsPerPage)
  }, [currentPage, rows])

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
        const leases = await getLeases()
        const filteredLeases = leases.filter((lease) => matchesFilters(lease, appliedFilters))

        const flattened = (
          await Promise.all(
            filteredLeases.map(async (lease) => {
              try {
                const cashflowResponse = await getLeasePaymentCashflows(lease.leaseId)
                return buildMonthlyRentPayScheduleRows(lease, cashflowResponse.cashflows ?? [])
              } catch {
                return []
              }
            }),
          )
        ).flat().sort((left, right) => {
          const branchComparison = (left.branchCode ?? "").localeCompare(right.branchCode ?? "")
          if (branchComparison !== 0) {
            return branchComparison
          }

          const lessorComparison = (left.lessorName ?? "").localeCompare(right.lessorName ?? "")
          if (lessorComparison !== 0) {
            return lessorComparison
          }

          return left.dueDate.localeCompare(right.dueDate)
        })

        if (isActive) {
          setRows(flattened)
          setCurrentPage(1)
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load the monthly rent pay schedule."

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
    setCurrentPage(1)
    setAppliedFilters(filters)
  }

  function resetFilters() {
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setCurrentPage(1)
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
      "Branch Name",
      "Branch Code",
      "Lessor Name",
      "Bank Account Number",
      "Bank Code",
      "Month",
      "Net rent payment",
      "Utility Bill payment",
      "Gross Rent Payable",
      "WHT-10%",
      "Net Rent Pay",
      "VAT",
      "Net Rent + VAT",
    ]

    const lines = rows.map((row) => {
      return [
        row.branchName,
        row.branchCode,
        row.lessorName,
        row.bankAccountNumber,
        row.bankCode,
        row.month,
        row.netRentPayment,
        row.utilityBillPayment,
        row.grossRentPayable,
        row.whtAmount,
        row.netRentPay,
        row.vatAmount,
        row.netRentPlusVat,
      ].map(toCsvCell)
    })

    const csvContent = [headers.map(toCsvCell), ...lines]
      .map((line) => line.join(","))
      .join("\n")

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    })

    const fileName = `monthly-rent-pay-schedule-${new Date().toISOString().slice(0, 10)}.csv`

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

  return (
    <section className="mx-auto w-full max-w-384 space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Monthly Rent Pay Schedule
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monthly rent payment schedule built from lease and cashflow data.
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
          <span className="text-xs text-muted-foreground">({filterCount} applied)</span>
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

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-400 text-sm">
            <thead className="text-xs uppercase text-black">
              <tr className="bg-fuchsia-300">
                <th className="border px-3 py-3 text-left">Branch Name</th>
                <th className="border px-3 py-3 text-left">Branch Code</th>
                <th className="border px-3 py-3 text-left">Lessor Name</th>
                <th className="border px-3 py-3 text-left">Bank Account Number</th>
                <th className="border px-3 py-3 text-left">Bank Code</th>
                <th className="border px-3 py-3 text-left">Month</th>
                <th className="border px-3 py-3 text-left">Net rent payment</th>
                <th className="border px-3 py-3 text-left">Utility Bill payment</th>
                <th className="border px-3 py-3 text-left">Gross Rent Payable</th>
                <th className="border px-3 py-3 text-left">WHT</th>
                <th className="border px-3 py-3 text-left">Net Rent Pay</th>
                <th className="border px-3 py-3 text-left">VAT</th>
                <th className="border px-3 py-3 text-left">Net Rent + VAT</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-4 py-6 text-center text-muted-foreground">
                    Loading monthly rent pay schedule...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-6 text-center text-muted-foreground">
                    No monthly rent payment records found for the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, index) => (
                  <tr key={`${row.branchCode ?? "branch"}-${row.lessorName ?? "lessor"}-${row.month}-${index}`} className="hover:bg-muted/30">
                    <td className="px-3 py-2">{displayValue(row.branchName)}</td>
                    <td className="px-3 py-2">{displayValue(row.branchCode)}</td>
                    <td className="px-3 py-2">{displayValue(row.lessorName)}</td>
                    <td className="px-3 py-2">{displayValue(row.bankAccountNumber)}</td>
                    <td className="px-3 py-2">{displayValue(row.bankCode)}</td>
                    <td className="px-3 py-2">{displayValue(row.month)}</td>
                    <td className="px-3 py-2">{displayValue(formatCurrency(row.netRentPayment))}</td>
                    <td className="px-3 py-2">{displayValue(formatCurrency(row.utilityBillPayment))}</td>
                    <td className="px-3 py-2">{displayValue(formatCurrency(row.grossRentPayable))}</td>
                    <td className="px-3 py-2">{displayValue(formatCurrency(row.whtAmount))}</td>
                    <td className="px-3 py-2">{displayValue(formatCurrency(row.netRentPay))}</td>
                    <td className="px-3 py-2">{displayValue(formatCurrency(row.vatAmount))}</td>
                    <td className="px-3 py-2">{displayValue(formatCurrency(row.netRentPlusVat))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground">
            Showing {rows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, rows.length)} of {rows.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setCurrentPage((value) => Math.max(value - 1, 1))}
              disabled={currentPage <= 1 || loading}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setCurrentPage((value) => Math.min(value + 1, totalPages))}
              disabled={currentPage >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </section>
  )
}

function matchesFilters(lease: Lease, filters: FilterState) {
  if (filters.branchId.trim() && String(lease.branchId ?? "") !== filters.branchId.trim()) {
    return false
  }

  if (
    filters.leaseStatus.trim() &&
    (lease.leaseStatus ?? "").toLowerCase() !== filters.leaseStatus.trim().toLowerCase()
  ) {
    return false
  }

  if (filters.startDateFrom && lease.startDate && lease.startDate < filters.startDateFrom) {
    return false
  }

  if (filters.startDateTo && lease.startDate && lease.startDate > filters.startDateTo) {
    return false
  }

  if (filters.endDateFrom && lease.endDate && lease.endDate < filters.endDateFrom) {
    return false
  }

  if (filters.endDateTo && lease.endDate && lease.endDate > filters.endDateTo) {
    return false
  }

  return true
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

function toCsvCell(value: unknown) {
  if (value === null || value === undefined) {
    return ""
  }

  const stringValue = String(value).replace(/"/g, '""')
  return `"${stringValue}"`
}
