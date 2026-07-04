import { apiRequest } from "@/api/client"
import type {
  Ifrs16LeaseIndentureSummaryRow,
  Ifrs16ReportFilters,
} from "@/types/ifrs16-report"

function toQueryString(filters: Ifrs16ReportFilters) {
  const params = new URLSearchParams()

  if (typeof filters.branchId === "number") {
    params.set("branchId", String(filters.branchId))
  }

  if (filters.leaseStatus?.trim()) {
    params.set("leaseStatus", filters.leaseStatus.trim())
  }

  if (filters.startDateFrom) {
    params.set("startDateFrom", filters.startDateFrom)
  }

  if (filters.startDateTo) {
    params.set("startDateTo", filters.startDateTo)
  }

  if (filters.endDateFrom) {
    params.set("endDateFrom", filters.endDateFrom)
  }

  if (filters.endDateTo) {
    params.set("endDateTo", filters.endDateTo)
  }

  return params.toString()
}

export async function getIfrs16LeaseIndentureSummaryReport(
  filters: Ifrs16ReportFilters,
) {
  const query = toQueryString(filters)
  const path = query ? `/leases/ifrs16-report?${query}` : "/leases/ifrs16-report"
  return await apiRequest<Ifrs16LeaseIndentureSummaryRow[]>(path)
}
