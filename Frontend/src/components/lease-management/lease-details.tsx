import {
  CalendarClock,
  Building2,
  FileText,
  Info,
  Loader2,
} from "lucide-react";

import type { Lease, LeaseStatus } from "@/types/lease";

type LeaseDetailsProps = {
  selectedLease: Lease | null;
  error: string | null;
  isLoading: boolean;
};

export function LeaseDetails({
  selectedLease,
  error,
  isLoading,
}: LeaseDetailsProps) {
  if (error) {
    return (
      <div className="space-y-5 p-1">
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-5 p-1">
        <div className="rounded-xl border bg-muted/40 p-10 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="size-4 animate-spin" />
            <span>Loading lease details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedLease) {
    return (
      <div className="space-y-5 p-1">
        <div className="rounded-xl border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
          Select a lease from the list to view the full record.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-1">
      <div className="grid gap-4 lg:grid-cols-2">
        <InfoPanel
          icon={<Info className="size-4 text-muted-foreground" />}
          title="Lease Information"
          rows={[
            { label: "Lease No", value: selectedLease.leaseNo },
            {
              label: "Branch",
              value:
                selectedLease.branch?.branchName ??
                selectedLease.branch?.oracleCode ??
                `#${selectedLease.branchId ?? "--"}`,
            },
            {
              label: "Lessor",
              value:
                selectedLease.lessor?.fullName ??
                `#${selectedLease.lessorId ?? "--"}`,
            },
            {
              label: "Property Address",
              value: selectedLease.leasePropertyAddress,
            },
            {
              label: "Status",
              value: normalizeStatus(selectedLease.leaseStatus),
            },
          ]}
        />

        <InfoPanel
          icon={<CalendarClock className="size-4 text-muted-foreground" />}
          title="Audit Information"
          rows={[
            { label: "Lease ID", value: String(selectedLease.leaseId) },
            {
              label: "Created At",
              value: formatDateTime(selectedLease.createdAt),
            },
            {
              label: "Updated At",
              value: formatDateTime(selectedLease.updatedAt),
            },
            {
              label: "Payment Schedules",
              value: String(selectedLease.paymentSchedules?.length ?? 0),
            },
          ]}
        />
      </div>

      <div className="rounded-2xl border p-5">
        <SectionHeader
          icon={<Building2 className="size-4 text-muted-foreground" />}
          title="Lease Terms"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <InfoRow
            label="Sqft"
            value={formatDisplayValue(selectedLease.sqft)}
          />
          <InfoRow label="Start Date" value={selectedLease.startDate} />
          <InfoRow label="End Date" value={selectedLease.endDate} />
          <InfoRow
            label="Number of Years"
            value={formatDisplayValue(selectedLease.numberOfYears)}
          />
          <InfoRow
            label="Remaining Period"
            value={selectedLease.remainingPeriod}
          />
          <InfoRow
            label="Agreement Value"
            value={formatCurrency(selectedLease.agreementValue)}
          />
          <InfoRow
            label="Annual Rate"
            value={formatPercentage(selectedLease.annualRate)}
          />
          <InfoRow
            label="Utility Bill"
            value={formatCurrency(selectedLease.utilityBill)}
          />
          <InfoRow
            label="WHT Rate"
            value={formatPercentage(selectedLease.whtRate)}
          />
          <InfoRow
            label="VAT Rate"
            value={formatPercentage(selectedLease.vatRate)}
          />
          <InfoRow
            label="Rent Advance"
            value={formatCurrency(selectedLease.rentAdvance)}
          />
          <InfoRow
            label="Rent Advance Period"
            value={formatDisplayValue(selectedLease.rentAdvancePeriod)}
          />
          <InfoRow
            label="Refundable Deposit"
            value={formatCurrency(selectedLease.refundableDeposit)}
          />
          <InfoRow
            label="Notice Period Months"
            value={formatDisplayValue(selectedLease.noticePeriodMonths)}
          />
          <InfoRow
            label="Payment Timing"
            value={
              selectedLease.isPaymentAtBeginning
                ? "Beginning of Month"
                : "End of Month"
            }
          />
          <InfoRow label="Extensions" value={selectedLease.extensions} />
          <InfoRow label="Remarks" value={selectedLease.remarks} />
        </div>
      </div>

      <div className="rounded-2xl border p-5">
        <SectionHeader
          icon={<FileText className="size-4 text-muted-foreground" />}
          title="Payment Schedules"
        />
        <div className="mt-4 overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-muted/90 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Year</th>
                  <th className="px-4 py-3 text-left">Gross Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedLease.paymentSchedules?.length ? (
                  selectedLease.paymentSchedules.map((schedule) => (
                    <tr
                      key={schedule.paymentScheduleId}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 font-medium">
                        {formatDisplayValue(schedule.leaseYear)}
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(schedule.grossAmount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-muted-foreground"
                      colSpan={2}
                    >
                      No payment schedules attached.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

type InfoPanelProps = {
  icon: React.ReactNode;
  title: string;
  rows: Array<{ label: string; value: string | number | null | undefined }>;
};

function InfoPanel({ icon, title, rows }: InfoPanelProps) {
  return (
    <div className="rounded-2xl border p-5">
      <SectionHeader icon={icon} title={title} />
      <div className="mt-4 grid gap-3 text-sm">
        {rows.map((row) => (
          <InfoRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b pb-3">
      {icon}
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
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

function normalizeStatus(
  status: LeaseStatus | string | null | undefined,
): LeaseStatus {
  return status === "Terminate" ? "Terminate" : "Active";
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

function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  const numericValue = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 2 }).format(
    numericValue,
  );
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

function formatDisplayValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  return String(value);
}
