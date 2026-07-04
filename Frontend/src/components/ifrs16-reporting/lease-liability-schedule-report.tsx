import { useEffect, useMemo, useState } from "react"
import { Download, Filter, Search } from "lucide-react"

import { getBranches } from "@/api/branches.api"
import { getLeases, getLeasePaymentCashflows } from "@/api/leases.api"
import {
  buildLeaseLiabilityScheduleRows,
  type LeaseLiabilityScheduleRow,
} from "@/lib/reporting-calculations"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/useToast"
import type { Branch } from "@/types/branch"

type FilterState = {
  branchId: string
  leaseStatus: string
  monthFrom: string
  monthTo: string
}

const emptyFilters: FilterState = {
  branchId: "",
  leaseStatus: "Active",
  monthFrom: "",
  monthTo: "",
}

export function LeaseLiabilityScheduleReport() {
  const { addToast } = useToast()

  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters)
  const [rows, setRows] = useState<LeaseLiabilityScheduleRow[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 20

  const filterCount = useMemo(
    () => Object.values(appliedFilters).filter((v) => v.trim().length > 0).length,
    [appliedFilters],
  )

  const totalPages = Math.max(Math.ceil(rows.length / rowsPerPage), 1)
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return rows.slice(start, start + rowsPerPage)
  }, [currentPage, rows])

  useEffect(() => {
    let active = true
    getBranches()
      .then((b) => { if (active) setBranches(b) })
      .catch(() => { if (active) setBranches([]) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const allLeases = await getLeases()

        const filtered = allLeases.filter((lease) => {
          if (
            appliedFilters.branchId.trim() &&
            String(lease.branchId ?? "") !== appliedFilters.branchId.trim()
          ) return false

          if (
            appliedFilters.leaseStatus.trim() &&
            (lease.leaseStatus ?? "").toLowerCase() !==
              appliedFilters.leaseStatus.trim().toLowerCase()
          ) return false

          return true
        })

        const built: LeaseLiabilityScheduleRow[] = []

        await Promise.all(
          filtered.map(async (lease) => {
            try {
              const cf = await getLeasePaymentCashflows(lease.leaseId)
              built.push(
                ...buildLeaseLiabilityScheduleRows(
                  lease,
                  cf.cashflows ?? [],
                  appliedFilters.monthFrom,
                  appliedFilters.monthTo,
                ),
              )
            } catch {
              // skip failed leases
            }
          }),
        )

        // Apply monthFrom filter for rows that were skipped above due to range
        const finalRows = built
          .filter((r) => {
            if (appliedFilters.monthFrom && r.dueDate < appliedFilters.monthFrom + "-01") return false
            return true
          })
          .sort((a, b) => {
            const branch = (a.branchCode ?? "").localeCompare(b.branchCode ?? "")
            if (branch !== 0) return branch
            return a.dueDate.localeCompare(b.dueDate)
          })

        if (active) {
          setRows(finalRows)
          setCurrentPage(1)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load lease liability schedule."
        if (active) {
          setError(message)
          setRows([])
        }
        addToast({ title: "Unable to load report", description: message, type: "error" })
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [addToast, appliedFilters])

  function exportToCsv() {
    if (!rows.length) {
      addToast({ title: "No data to export", description: "Apply filters or load data before exporting.", type: "error" })
      return
    }

    const headers = [
      "Branch Code",
      "Branch Name",
      "Month",
      "Opening Lease Liability Balance",
      "Interest Accrued for the Period",
      "Monthly Rental Payment",
      "Closing Lease Liability Balance",
    ]

    const lines = rows.map((row) =>
      [
        row.branchCode,
        row.branchName,
        row.monthLabel,
        row.openingBalance,
        row.interestAccrued,
        row.monthlyRentalPayment,
        row.closingBalance,
      ].map(toCsvCell),
    )

    const csv = [headers.map(toCsvCell), ...lines].map((l) => l.join(",")).join("\n")
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `lease-liability-schedule-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    addToast({ title: "Export complete", description: "Report downloaded as an Excel-compatible CSV file.", type: "success" })
  }

  return (
    <section className="mx-auto w-full max-w-[96rem] space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lease Liability Schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Opening and closing discounted lease liability balances per branch, per month.
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

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium">
          <Filter className="size-4 text-muted-foreground" />
          Filters
          <span className="text-xs text-muted-foreground">({filterCount} applied)</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Branch
            <select
              value={filters.branchId}
              onChange={(e) => setFilters((f) => ({ ...f, branchId: e.target.value }))}
              className="h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground"
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.branchId} value={String(b.branchId)}>
                  {b.branchCode || b.oracleCode} - {b.branchName}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Lease Status
            <select
              value={filters.leaseStatus}
              onChange={(e) => setFilters((f) => ({ ...f, leaseStatus: e.target.value }))}
              className="h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground"
            >
              <option value="Active">Active</option>
              <option value="Terminate">Terminate</option>
            </select>
          </label>

          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Month From
            <input
              type="month"
              value={filters.monthFrom}
              onChange={(e) => setFilters((f) => ({ ...f, monthFrom: e.target.value }))}
              className="h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Month To
            <input
              type="month"
              value={filters.monthTo}
              onChange={(e) => setFilters((f) => ({ ...f, monthTo: e.target.value }))}
              className="h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button className="cursor-pointer" onClick={() => { setCurrentPage(1); setAppliedFilters(filters) }}>
            <Search className="size-4" />
            Apply Filters
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => { setFilters(emptyFilters); setAppliedFilters(emptyFilters); setCurrentPage(1) }}
            disabled={loading}
          >
            Reset
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] text-sm">
            <thead className="text-xs uppercase text-white/90">
              <tr className="bg-black/50">
                <th className="border px-3 py-3 text-left">Branch Code</th>
                <th className="border px-3 py-3 text-left">Branch Name</th>
                <th className="border px-3 py-3 text-left">Month</th>
                <th className="border px-3 py-3 text-right">Opening Lease Liability Balance</th>
                <th className="border px-3 py-3 text-right">Interest Accrued for the Period</th>
                <th className="border px-3 py-3 text-right">Monthly Rental Payment</th>
                <th className="border px-3 py-3 text-right">Closing Lease Liability Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    Loading lease liability schedule...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    No records found for the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, i) => (
                  <tr key={`${row.leaseId}-${row.dueDate}-${i}`} className="hover:bg-muted/30">
                    <td className="px-3 py-2">{displayValue(row.branchCode)}</td>
                    <td className="px-3 py-2">{displayValue(row.branchName)}</td>
                    <td className="px-3 py-2">{row.monthLabel}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.openingBalance)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.interestAccrued)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.monthlyRentalPayment)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.closingBalance)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground">
            Showing {rows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{" "}
            {Math.min(currentPage * rowsPerPage, rows.length)} of {rows.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
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
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function displayValue(value: string | null | undefined) {
  return value ?? "-"
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function toCsvCell(value: unknown) {
  if (value === null || value === undefined) return ""
  return `"${String(value).replace(/"/g, '""')}"`
}
