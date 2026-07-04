import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Loader2, RotateCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lease, LeaseStatus } from "@/types/lease";
import { RoleGate } from "@/components/auth/role-gate";

type LeaseListProps = {
  loading: boolean;
  error: unknown;
  leases: Lease[];
  onViewClick: (leaseId: number) => void;
  onEditClick: (lease: Lease) => void;
  onRetry: () => void;
};

export function LeaseList({
  loading,
  error,
  leases,
  onViewClick,
  onEditClick,
  onRetry,
}: LeaseListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeases = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return leases;
    }

    return leases.filter((lease) => {
      const haystack = [
        lease.leaseNo,
        lease.leasePropertyAddress,
        lease.leaseStatus,
        lease.branch?.oracleCode,
        lease.branch?.branchName,
        lease.lessor?.fullName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [leases, searchQuery]);

  return (
    <div className="space-y-4 p-1">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-1 items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm shadow-xs">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by lease no, branch, lessor, or status"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="cursor-default">
            All ({leases.length})
          </Button>
          <Button size="sm" variant="outline" className="cursor-default">
            Filtered ({filteredLeases.length})
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/90 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Lease No</th>
                <th className="px-4 py-3 text-left">Branch</th>
                <th className="px-4 py-3 text-left">Lessor</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Annual Rate</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Loading leases...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>An unexpected error occurred.</span>
                      <Button
                        size="sm"
                        variant="link"
                        className="cursor-pointer p-0 text-foreground underline hover:text-foreground"
                        onClick={onRetry}
                      >
                        Retry
                        <RotateCw className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filteredLeases.length > 0 ? (
                filteredLeases.map((lease) => (
                  <tr
                    key={lease.leaseId}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {lease.leaseNo ?? "--"}
                    </td>
                    <td className="px-4 py-3">
                      {lease.branch?.branchName ??
                        lease.branch?.oracleCode ??
                        `#${lease.branchId ?? "--"}`}
                    </td>
                    <td className="px-4 py-3">
                      {lease.lessor?.fullName ?? `#${lease.lessorId ?? "--"}`}
                    </td>
                    <td className="px-4 py-3">
                      {lease.leasePropertyAddress ?? "--"}
                    </td>
                    <td className="px-4 py-3">
                      {formatPercentage(lease.annualRate)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={normalizeStatus(lease.leaseStatus)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => onViewClick(lease.leaseId)}
                      >
                        View
                      </Button>
                      <RoleGate allowedRoles={["admin", "data_entry"]}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-2 cursor-pointer"
                        onClick={() => onEditClick(lease)}
                      >
                        Edit
                      </Button>
                      </RoleGate>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    No leases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: LeaseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        status === "Active"
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-muted-foreground/20 bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

function normalizeStatus(
  status: LeaseStatus | string | null | undefined,
): LeaseStatus {
  return status === "Terminate" ? "Terminate" : "Active";
}

function formatPercentage(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  const numericValue = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return `${new Intl.NumberFormat("en-LK", {
    maximumFractionDigits: 2,
  }).format(numericValue)}%`;
}
