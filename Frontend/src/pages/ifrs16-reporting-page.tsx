import { useState } from "react"

import { HorizontalTabs } from "@/components/ui/horizontal-tabs"
import { LeaseIndentureSummaryReport } from "@/components/ifrs16-reporting/lease-indenture-summary-report"
import { MonthlyRentPayScheduleReport } from "@/components/ifrs16-reporting/monthly-rent-pay-schedule-report"
import { LeaseLiabilityScheduleReport } from "@/components/ifrs16-reporting/lease-liability-schedule-report"
import { PageHeader } from "@/components/ui/page-header"


type ReportView = "summary-of-lease-indentures" | "monthly-rent-pay-schedule" | "lease-liability-schedule"

const tabs = [
  { value: "summary-of-lease-indentures", label: "Summary of Lease Indentures" },
  { value: "monthly-rent-pay-schedule", label: "Monthly Rent Pay Schedule" },
  { value: "lease-liability-schedule", label: "Lease Liability Schedule" },
] as const

export function Ifrs16ReportingPage() {
  const [activeView, setActiveView] = useState<ReportView>(
    "summary-of-lease-indentures",
  )

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="IFRS 16 Reporting"
        description="Generate comprehensive reports to analyze lease data and ensure compliance with IFRS 16 standards."
      />

      <HorizontalTabs
        tabs={tabs as unknown as { value: string; label: string }[]}
        value={activeView}
        onChange={(value) => setActiveView(value as ReportView)}
      />

      {activeView === "summary-of-lease-indentures" ? (
        <LeaseIndentureSummaryReport />
      ) : activeView === "monthly-rent-pay-schedule" ? (
        <MonthlyRentPayScheduleReport />
      ) : (
        <LeaseLiabilityScheduleReport />
      )}
    </section>
  )
}
