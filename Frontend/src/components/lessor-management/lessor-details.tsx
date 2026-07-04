import { Building2, CalendarClock, Info, Loader2 } from "lucide-react";

import type { Lessor } from "@/types/lessor";

type LessorDetailsProps = {
  selectedLessor: Lessor | null;
  error: string | null;
  isLoading: boolean;
};

export function LessorDetails({
  selectedLessor,
  error,
  isLoading,
}: LessorDetailsProps) {
  return (
    <div className="space-y-5 p-1">
      {!selectedLessor ? (
        <div className="rounded-xl border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
          Select a lessor from the list to view the full record.
        </div>
      ) : isLoading ? (
        <div className="rounded-xl border bg-muted/40 p-10 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="size-4 animate-spin" />
            <span>Loading lessor details...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border p-5">
              <div className="flex items-center gap-2 border-b pb-3">
                <Info className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Lessor Information
                </h3>
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                <InfoRow label="Full Name" value={selectedLessor.fullName} />
                <InfoRow label="NIC" value={selectedLessor.nic} />
                <InfoRow label="Address" value={selectedLessor.address} />
                <InfoRow label="Bank Name" value={selectedLessor.bankName} />
                <InfoRow
                  label="Account Number"
                  value={selectedLessor.accountNumber}
                />
                <InfoRow label="Bank Code" value={selectedLessor.bankCode} />
              </div>
            </div>
            <div className="rounded-2xl border p-5">
              <div className="flex items-center gap-2 border-b pb-3">
                <CalendarClock className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Audit Information
                </h3>
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                <InfoRow
                  label="Lessor ID"
                  value={String(selectedLessor.lessorId)}
                />
                <InfoRow
                  label="Created At"
                  value={formatDateTime(selectedLessor.createdAt)}
                />
                <InfoRow
                  label="Updated At"
                  value={formatDateTime(selectedLessor.updatedAt)}
                />
                <InfoRow
                  label="Linked Leases"
                  value={String(selectedLessor.leases?.length ?? 0)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-5">
            <div className="flex items-center gap-2 border-b pb-3">
              <Building2 className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Related Leases
              </h3>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b bg-muted/90 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Lease No</th>
                      <th className="px-4 py-3 text-left">Property</th>
                      <th className="px-4 py-3 text-left">Agreement Value</th>
                      <th className="px-4 py-3 text-left">Annual Rate</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Start Date</th>
                      <th className="px-4 py-3 text-left">End Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedLessor.leases?.length ? (
                      selectedLessor.leases.map((lease) => (
                        <tr
                          key={lease.leaseId}
                          className="transition-colors hover:bg-muted/50"
                        >
                          <td className="px-4 py-3 font-medium">
                            {lease.leaseNo ?? "--"}
                          </td>
                          <td className="px-4 py-3">
                            {lease.leasePropertyAddress ?? "--"}
                          </td>
                          <td className="px-4 py-3">
                            {formatDisplayValue(lease.agreementValue)}
                          </td>
                          <td className="px-4 py-3">
                            {formatPercentage(lease.annualRate)}
                          </td>
                          <td className="px-4 py-3">
                            {lease.leaseStatus ?? "--"}
                          </td>
                          <td className="px-4 py-3">
                            {lease.startDate ?? "--"}
                          </td>
                          <td className="px-4 py-3">{lease.endDate ?? "--"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="px-4 py-8 text-center text-muted-foreground"
                          colSpan={7}
                        >
                          This lessor has no linked leases yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate font-medium text-foreground">
        {value ?? "--"}
      </span>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDisplayValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-LK", {
      maximumFractionDigits: 2,
    }).format(value);
  }

  return value;
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
