import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  LineChart,
  Search,
  Table2,
} from "lucide-react";

import {
  getLeasePaymentCashflowSummary,
  getLeasePaymentCashflowsByYear,
  getLeasePaymentCashflows,
} from "@/api/leases.api";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useLeases } from "@/hooks/useLeases";
import { buildAmortizationRows } from "@/lib/reporting-calculations";
import { cn } from "@/lib/utils";
import {
  calculateDaysInMonth,
  calculateTotalnumberOfDays,
} from "@/lib/monthdays";
import type { CashflowResponse, CashflowSummary } from "@/types/cashflow";
import type { Lease } from "@/types/lease";

const currencyFormatter = new Intl.NumberFormat("en-LK", {
  maximumFractionDigits: 2,
});

export function PaymentSchedulePage() {
  const { data: leases, loading, error, refresh } = useLeases();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeaseId, setSelectedLeaseId] = useState<number | null>(null);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [leaseSummary, setLeaseSummary] = useState<CashflowSummary | null>(
    null,
  );
  const [perdayAmortisation, setPerDayAmortisation] = useState<number | null>(
    null,
  );
  const [totalDays, setTotalDays] = useState<number>(0);
  const [selectedYearCashflow, setSelectedYearCashflow] =
    useState<CashflowResponse | null>(null);
  const [fullCashflow, setFullCashflow] = useState<CashflowResponse | null>(
    null,
  );
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"payment" | "amortization">(
    "payment",
  );
  const [selectedYear, setSelectedYear] = useState(1);
  const [totalYears, setTotalYears] = useState(0);
  const skipNextYearFetchRef = useRef(false);

  useEffect(() => {
    if (!selectedLeaseId) {
      setSelectedLease(null);
      setLeaseSummary(null);
      setSelectedYearCashflow(null);
      setFullCashflow(null);
      setDetailsError(null);
      setActiveTab("payment");
      setSelectedYear(1);
      setTotalYears(0);
      return;
    }

    const leaseId = selectedLeaseId;
    setSelectedYear(1);
    setSelectedLease(leases.find((item) => item.leaseId === leaseId) ?? null);
    setLeaseSummary(null);
    setSelectedYearCashflow(null);
    setDetailsError(null);
    setActiveTab("payment");
    setLoadingDetails(true);
    skipNextYearFetchRef.current = true;

    let isActive = true;

    async function loadLeaseDetail() {
      try {
        const lease = leases.find((item) => item.leaseId === leaseId) ?? null;
        const summaryResponse = await getLeasePaymentCashflowSummary(leaseId);
        const initialYearResponse = await getLeasePaymentCashflowsByYear(
          leaseId,
          1,
        );

        if (!isActive) {
          return;
        }

        setSelectedLease(lease);
        setLeaseSummary(summaryResponse);
        const leaseTotalDays = calculateTotalnumberOfDays(
          lease?.startDate,
          lease?.endDate,
        );
        const totalLiability =
          summaryResponse.totals.totalPresentValue +
          summaryResponse.totals.totalRentAdvanceDeduction;

        setTotalDays(leaseTotalDays);
        setPerDayAmortisation(totalLiability / (leaseTotalDays || 1));
        setSelectedYearCashflow(initialYearResponse);
        setFullCashflow(null);
        setTotalYears(getLeaseYearCountFromLease(lease) || 1);
      } catch (err) {
        if (!isActive) {
          return;
        }

        setSelectedLease(null);
        setLeaseSummary(null);
        setSelectedYearCashflow(null);
        setDetailsError(
          err instanceof Error
            ? err.message
            : "Failed to load payment schedule.",
        );
      } finally {
        if (isActive) {
          setLoadingDetails(false);
          skipNextYearFetchRef.current = false;
        }
      }
    }

    loadLeaseDetail();

    return () => {
      isActive = false;
    };
  }, [leases, selectedLeaseId]);

  // Fetch full schedule only when amortization tab is opened
  useEffect(() => {
    if (activeTab !== "amortization" || !selectedLeaseId) {
      return;
    }

    // If we already have the full cashflow for this lease, skip fetch
    if (fullCashflow) {
      return;
    }

    let isActive = true;
    setLoadingDetails(true);
    setDetailsError(null);

    async function loadFullCashflow() {
      try {
        const response = await getLeasePaymentCashflows(
          selectedLeaseId as number,
        );
        if (!isActive) return;
        setFullCashflow(response);
      } catch (err) {
        if (!isActive) return;
        setDetailsError(
          err instanceof Error ? err.message : "Failed to load full cashflow.",
        );
      } finally {
        if (isActive) setLoadingDetails(false);
      }
    }

    loadFullCashflow();

    return () => {
      isActive = false;
    };
  }, [activeTab, selectedLeaseId, fullCashflow]);

  // Fetch data when year changes
  useEffect(() => {
    if (!selectedLeaseId || selectedYear <= 0) {
      return;
    }

    if (skipNextYearFetchRef.current && selectedYear === 1) {
      return;
    }

    let isActive = true;

    async function loadYearData() {
      setLoadingDetails(true);
      setDetailsError(null);

      try {
        const response = await getLeasePaymentCashflowsByYear(
          selectedLeaseId as number,
          selectedYear,
        );

        if (!isActive) {
          return;
        }

        setSelectedYearCashflow(response);
      } catch (err) {
        if (!isActive) {
          return;
        }

        setSelectedYearCashflow(null);
        setDetailsError(
          err instanceof Error ? err.message : "Failed to load year data.",
        );
      } finally {
        if (isActive) {
          setLoadingDetails(false);
        }
      }
    }

    loadYearData();

    return () => {
      isActive = false;
    };
  }, [selectedLeaseId, selectedYear]);

  const handlePreviousYear = () => {
    if (selectedYear > 1) {
      setSelectedYear(selectedYear - 1);
    }
  };

  const handleNextYear = () => {
    if (selectedYear < totalYears) {
      setSelectedYear(selectedYear + 1);
    }
  };

  const filteredLeases = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return leases;
    }

    return leases.filter((lease) => {
      const haystack = [
        lease.leaseNo,
        lease.leasePropertyAddress,
        lease.branch?.branchName,
        lease.branch?.oracleCode,
        lease.lessor?.fullName,
        lease.leaseStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [leases, searchQuery]);

  const summaryCards = useMemo(() => {
    if (!leaseSummary) {
      return [];
    }

    return [
      {
        label: "Total Gross Rent",
        value: formatCurrency(leaseSummary.totals.totalGrossRent),
      },
      {
        label: "Rent Advance Deduction",
        value: formatCurrency(leaseSummary.totals.totalRentAdvanceDeduction),
      },
      {
        label: "Total Net Cash Flow",
        value: formatCurrency(leaseSummary.totals.totalNetCashFlow),
      },
      {
        label: "Initial Liability",
        value: formatCurrency(leaseSummary.totals.totalPresentValue),
      },
      {
        label: "Per day Amortisation",
        value: formatCurrency(perdayAmortisation),
      },
      {
        label: "Total Number of Days",
        value: String(totalDays),
      },
    ];
  }, [leaseSummary, perdayAmortisation, totalDays]);

  const amortizationRows = useMemo(() => {
    const rows = buildAmortizationRows(
      leaseSummary,
      selectedLease,
      fullCashflow?.cashflows ?? selectedYearCashflow?.cashflows,
    );

    let cumulativeAmortisation = 0;
    let totaldays = 0;
    let carryingValue = perdayAmortisation ? perdayAmortisation * totalDays : 0;
    return rows.map((row) => {
      const monthlyAmortisation =
        (perdayAmortisation ?? 0) * calculateDaysInMonth(row.periodLabel);

      cumulativeAmortisation += monthlyAmortisation;
      totaldays += calculateDaysInMonth(row.periodLabel);

      return {
        ...row,
        monthlyAmortisation,
        cumulativeAmortisation,
        totaldays,
        carryingValue: Math.max(carryingValue - cumulativeAmortisation, 0),
      };
    });
  }, [
    leaseSummary,
    selectedLease,
    selectedYearCashflow,
    fullCashflow,
    perdayAmortisation,
  ]);

  const amortizationColumns = [
    "Period",
    "Per Month Amortisation",
    "Cumulative Amortisation",
    "Carrying Value of ROU Asset "
  ];

  const handleExportAmortizationSchedule = () => {
    if (!amortizationRows.length) {
      return;
    }

    const fileName = buildAmortizationExportFileName(selectedLease);
    const csv = buildCsvContent(
      amortizationColumns,
      amortizationRows.map((row) => [
        row.periodLabel,
        formatCurrency(row.monthlyAmortisation),
        formatCurrency(row.cumulativeAmortisation),
        formatCurrency(row.carryingValue),
      ]),
    );

    downloadCsvFile(csv, fileName);
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Payment Schedule"
        description="Search leases, open a lease, and switch between the monthly payment schedule and the amortization view."
        actions={(
          <Button
            variant="outline"
            className="gap-2 self-start"
            onClick={refresh}
          >
            <Table2 className="size-4" />
            Refresh Leases
          </Button>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search lease no, branch, lessor"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Failed to load leases.
            </div>
          ) : null}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{leases.length} leases</span>
            <span>{filteredLeases.length} shown</span>
          </div>

          <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                Loading leases...
              </div>
            ) : filteredLeases.length > 0 ? (
              filteredLeases.map((lease) => (
                <button
                  key={lease.leaseId}
                  type="button"
                  onClick={() => {
                    setSelectedLeaseId(lease.leaseId);
                  }}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-colors hover:bg-muted/40",
                    selectedLeaseId === lease.leaseId &&
                    "border-primary bg-primary/5",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {lease.leaseNo ?? `Lease #${lease.leaseId}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {lease.branch?.branchName ??
                          lease.branch?.oracleCode ??
                          "Unknown branch"}
                      </p>
                    </div>
                    <span className="rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {normalizeStatus(lease.leaseStatus)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {lease.lessor?.fullName ?? "Unknown lessor"}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
                No leases found.
              </div>
            )}
          </div>
        </aside>

        <main className="space-y-6">
          {!selectedLeaseId ? (
            <EmptyState
              icon={<CalendarClock className="size-5" />}
              title="Select a lease"
              description="Choose a lease from the list to view the payment schedule and amortization table."
            />
          ) : loadingDetails ? (
            <EmptyState
              icon={<CalendarClock className="size-5" />}
              title="Loading schedule"
              description="Fetching lease details and payment cashflows."
            />
          ) : detailsError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {detailsError}
            </div>
          ) : leaseSummary && selectedYearCashflow ? (
            <>
              <section className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Selected lease
                      </p>
                      <h2 className="mt-2 wrap-break-word text-2xl font-semibold tracking-tight">
                        {selectedLease?.leaseNo ?? `Lease #${selectedLeaseId}`}
                      </h2>
                      <p className="mt-2 wrap-break-word text-sm text-muted-foreground">
                        {leaseSummary.address ??
                          selectedLease?.leasePropertyAddress ??
                          "No property address provided"}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-xl border bg-muted/20 px-4 py-3 text-left sm:text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Lease Period
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {selectedLease?.startDate ?? "--"} to{" "}
                        {selectedLease?.endDate ?? "--"}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <InfoItem
                      label="Annual Rate"
                      value={`${formatCurrency(leaseSummary.annualRate)}%`}
                    />
                    <InfoItem
                      label="Period"
                      value={String(leaseSummary.period ?? "--")}
                    />
                    <InfoItem
                      label="Advance"
                      value={formatCurrency(leaseSummary.advance)}
                    />
                    <InfoItem
                      label="Advance Period"
                      value={String(leaseSummary.advancePeriod ?? "--")}
                    />
                    <InfoItem
                      label="Payment Timing"
                      value={leaseSummary.paymentTiming}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                      <SummaryCard
                        key={card.label}
                        label={card.label}
                        value={card.value}
                      />
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center gap-4 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousYear}
                      disabled={selectedYear <= 1}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <div className="min-w-30 text-center">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Lease Year
                      </p>
                      <p className="text-lg font-semibold">
                        {selectedYear} of {totalYears}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextYear}
                      disabled={selectedYear >= totalYears}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-b pb-4">
                  <TabButton
                    active={activeTab === "payment"}
                    onClick={() => setActiveTab("payment")}
                    icon={<FileText className="size-4" />}
                    label="Monthly Payment Schedule"
                  />
                  <TabButton
                    active={activeTab === "amortization"}
                    onClick={() => setActiveTab("amortization")}
                    icon={<LineChart className="size-4" />}
                    label="Amortization Schedule"
                  />
                  {activeTab === "amortization" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-auto gap-2"
                      onClick={handleExportAmortizationSchedule}
                      disabled={!amortizationRows.length}
                    >
                      <Download className="size-4" />
                      Export CSV
                    </Button>
                  ) : null}
                </div>

                {activeTab === "payment" ? (
                  <ScheduleTable
                    columns={[
                      "Month",
                      "Lease Year",
                      "Due Date",
                      "Gross Rent",
                      "Rent Advance Deduction",
                      "Net Cash Flow",
                      "Present Value",
                    ]}
                    rows={selectedYearCashflow.cashflows.map((row) => [
                      `${row.monthName} ${row.year}`,
                      String(row.leaseYear),
                      row.dueDate,
                      formatCurrency(row.grossRent),
                      formatCurrency(row.rentAdvanceDeduction),
                      formatCurrency(row.netCashFlow),
                      formatCurrency(row.presentValue),
                    ])}
                    emptyText="No payment schedule rows available."
                  />
                ) : (
                  <ScheduleTable
                    columns={amortizationColumns}
                    rows={amortizationRows.map((row) => [
                      row.periodLabel,
                      formatCurrency(row.monthlyAmortisation),
                      formatCurrency(row.cumulativeAmortisation),
                      formatCurrency(row.carryingValue),
                    ])}
                    emptyText="No amortization schedule rows available."
                  />
                )}
              </section>
            </>
          ) : (
            <EmptyState
              icon={<Table2 className="size-5" />}
              title="Schedule unavailable"
              description="Select a lease to see its schedule."
            />
          )}
        </main>
      </div>
    </section>
  );
}

function getLeaseYearCountFromLease(lease: Lease | null) {
  const value = lease?.numberOfYears;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(Math.floor(value), 0);
}

function ScheduleTable({
  columns,
  rows,
  emptyText,
}: {
  columns: string[];
  rows: string[][];
  emptyText: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-muted/70 text-xs uppercase text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 text-left font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length > 0 ? (
              rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="transition-colors hover:bg-muted/30"
                >
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-8 text-center text-muted-foreground"
                  colSpan={columns.length}
                >
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "gap-2 rounded-none border-b-2 border-transparent px-4 text-muted-foreground",
        active && "border-primary text-primary",
      )}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border bg-muted/20 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 wrap-break-word text-lg font-semibold">{value}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-90 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border bg-background text-muted-foreground">
        {icon}
      </div>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function normalizeStatus(status: Lease["leaseStatus"]) {
  return status === "Terminate" ? "Terminate" : "Active";
}

function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  const numericValue = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return currencyFormatter.format(numericValue);
}

function buildAmortizationExportFileName(lease: Lease | null) {
  const leaseLabel =
    lease?.leaseNo?.trim() || `lease-${lease?.leaseId ?? "schedule"}`;
  return `amortization-schedule-${sanitizeFileNamePart(leaseLabel)}.csv`;
}

function buildCsvContent(columns: string[], rows: string[][]) {
  const csvRows = [
    columns.map((column) => escapeCsvValue(column)).join(","),
    ...rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(",")),
  ];

  return `\ufeff${csvRows.join("\r\n")}`;
}

function downloadCsvFile(content: string, fileName: string) {
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsvValue(value: string) {
  const normalized = value.replaceAll('"', '""');
  return `"${normalized}"`;
}

function sanitizeFileNamePart(value: string) {
  return value
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
