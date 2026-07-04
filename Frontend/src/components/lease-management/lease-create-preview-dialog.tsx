import { CheckCircle2, FileText, X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type {
  CreateLeaseInput,
  LeasePaymentScheduleInput,
} from "@/types/lease";

type LeaseCreatePreviewData = {
  payload: CreateLeaseInput;
  branchLabel: string;
  lessorLabel: string;
};

type LeaseCreatePreviewDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  previewData: LeaseCreatePreviewData | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function LeaseCreatePreviewDialog({
  open,
  isSubmitting,
  previewData,
  onConfirm,
  onCancel,
}: LeaseCreatePreviewDialogProps) {
  if (!open || !previewData) {
    return null;
  }

  const { payload, branchLabel, lessorLabel } = previewData;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lease-create-preview-title"
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <h2
                id="lease-create-preview-title"
                className="text-base font-semibold text-foreground"
              >
                Review Lease Details
              </h2>
              <p className="text-sm text-muted-foreground">
                Confirm the information below before creating the lease record.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close preview"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <PreviewCard
              title="Lease Information"
              icon={<FileText className="size-4" />}
            >
              <PreviewRow label="Branch" value={branchLabel} />
              <PreviewRow label="Lessor" value={lessorLabel} />
              <PreviewRow label="Lease No" value={payload.leaseNo} />
              <PreviewRow
                label="Property Address"
                value={payload.leasePropertyAddress}
              />
              <PreviewRow label="Status" value={payload.leaseStatus} />
            </PreviewCard>

            <PreviewCard
              title="Lease Terms"
              icon={<FileText className="size-4" />}
            >
              <PreviewRow
                label="Sqft"
                value={formatDisplayValue(payload.sqft)}
              />
              <PreviewRow label="Start Date" value={payload.startDate} />
              <PreviewRow label="End Date" value={payload.endDate} />
              <PreviewRow
                label="Number of Years"
                value={formatDisplayValue(payload.numberOfYears)}
              />
              <PreviewRow
                label="Agreement Value"
                value={formatCurrency(payload.agreementValue)}
              />
              <PreviewRow
                label="Annual Rate"
                value={formatPercentage(payload.annualRate)}
              />
              <PreviewRow
                label="Utility Bill"
                value={formatCurrency(payload.utilityBill)}
              />
              <PreviewRow
                label="WHT Rate"
                value={formatPercentage(payload.whtRate)}
              />
              <PreviewRow
                label="VAT Rate"
                value={formatPercentage(payload.vatRate)}
              />
              <PreviewRow
                label="Rent Advance"
                value={formatCurrency(payload.rentAdvance)}
              />
              <PreviewRow
                label="Rent Advance Period"
                value={formatDisplayValue(payload.rentAdvancePeriod)}
              />
              <PreviewRow
                label="Refundable Deposit"
                value={formatCurrency(payload.refundableDeposit)}
              />
              <PreviewRow
                label="Notice Period Months"
                value={formatDisplayValue(payload.noticePeriodMonths)}
              />
              <PreviewRow
                label="Payment Timing"
                value={
                  payload.isPaymentAtBeginning
                    ? "Beginning of Month"
                    : "End of Month"
                }
              />
            </PreviewCard>

            <div className="rounded-2xl border p-5 lg:col-span-2">
              <PreviewSectionHeader title="Schedules" />
              <div className="mt-4 overflow-hidden rounded-xl border">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b bg-muted/80 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">Year</th>
                        <th className="px-4 py-3 text-left">Gross Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payload.paymentSchedules.length ? (
                        payload.paymentSchedules.map(
                          (schedule: LeasePaymentScheduleInput) => (
                            <tr
                              key={schedule.leaseYear}
                              className="hover:bg-muted/40"
                            >
                              <td className="px-4 py-3 font-medium">
                                {schedule.leaseYear}
                              </td>
                              <td className="px-4 py-3">
                                {formatCurrency(schedule.grossAmount)}
                              </td>
                            </tr>
                          ),
                        )
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

            <PreviewCard title="Notes" icon={<FileText className="size-4" />}>
              <PreviewRow label="Extensions" value={payload.extensions} />
              <PreviewRow label="Remarks" value={payload.remarks} />
            </PreviewCard>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Lease"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border p-5">
      <PreviewSectionHeader title={title} icon={icon} />
      <div className="mt-4 grid gap-3 text-sm">{children}</div>
    </section>
  );
}

function PreviewSectionHeader({
  title,
  icon,
}: {
  title: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-b pb-3">
      {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
    </div>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 rounded-lg border bg-muted/25 px-3 py-2">
        {formatDisplay(value)}
      </div>
    </div>
  );
}

function formatDisplay(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  return String(value);
}

function formatDisplayValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  return String(value);
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

  return `${new Intl.NumberFormat("en-LK", { maximumFractionDigits: 2 }).format(
    numericValue,
  )}%`;
}
