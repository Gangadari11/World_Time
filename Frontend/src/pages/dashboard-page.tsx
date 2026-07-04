import { useMemo } from "react"
import { LayoutDashboard, Building2, Users, BarChart2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDashboard } from "@/hooks/useDashboard"

export function DashboardPage() {
  const { loading, error, summary, distribution, expirations, topLessors, branches } = useDashboard()

  const maxLessor = useMemo(() => {
    if (!topLessors || topLessors.length === 0) return 0
    return Math.max(...topLessors.map((t: any) => t.totalAgreementValue))
  }, [topLessors])

  function formatCurrency(value: number | null | undefined) {
    if (value === null || value === undefined) return "--"
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of IFRS 16 lease data, key metrics, and reporting status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm">Refresh</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border p-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-primary/10 p-2">
              <LayoutDashboard className="size-5 text-primary" />
            </span>
            <div>
              <div className="text-xs text-muted-foreground">Total Active Leases</div>
              <div className="text-2xl font-semibold">{loading ? "..." : summary?.totalActiveLeases ?? "--"}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-amber-50 p-2">
              <Building2 className="size-5 text-amber-600" />
            </span>
            <div>
              <div className="text-xs text-muted-foreground">Total Agreement Value</div>
              <div className="text-2xl font-semibold">{loading ? "..." : formatCurrency(summary?.totalAgreementValue)}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-green-50 p-2">
              <Users className="size-5 text-emerald-600" />
            </span>
            <div>
              <div className="text-xs text-muted-foreground">Avg Rent per Sqft</div>
              <div className="text-2xl font-semibold">{loading ? "..." : summary ? `${formatCurrency(summary.averageRentPerSqft)} / sqft` : "--"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top Lessors</h3>
            <div className="text-xs text-muted-foreground">Top by agreement value</div>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : topLessors.length === 0 ? (
              <div className="text-sm text-muted-foreground">No data</div>
            ) : (
              topLessors.map((t: any) => (
                <div key={t.lessor} className="flex items-center gap-3">
                  <div className="w-36 text-sm text-muted-foreground truncate">{t.lessor}</div>
                  <div className="flex-1">
                    <div className="h-3 w-full rounded bg-muted/50">
                      <div style={{ width: `${Math.round((t.totalAgreementValue / Math.max(1, maxLessor)) * 100)}%` }} className="h-3 rounded bg-primary" />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{formatCurrency(t.totalAgreementValue)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Remaining Term Distribution</h3>
            <BarChart2 className="size-4 text-muted-foreground" />
          </div>

          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : distribution ? (
              Object.entries(distribution).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">{k.replace('-', ' – ')}</div>
                  <div className="w-2/3">
                    <div className="h-3 w-full rounded bg-muted/50">
                      <div style={{ width: `${Math.round((v / Math.max(1, Object.values(distribution).reduce((a, b) => a + b, 0))) * 100)}%` }} className="h-3 rounded bg-primary" />
                    </div>
                  </div>
                  <div className="w-12 text-right font-medium">{v}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upcoming Expirations</h3>
            <div className="text-xs text-muted-foreground">30 / 90 / 365 days: {loading ? "..." : `${expirations?.count30 ?? 0} / ${expirations?.count90 ?? 0} / ${expirations?.count365 ?? 0}`}</div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-muted/90 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Lease No</th>
                    <th className="px-4 py-3 text-left">Branch</th>
                    <th className="px-4 py-3 text-left">End Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Loading...</td></tr>
                  ) : expirations?.items?.length ? (
                    expirations.items.slice(0, 10).map((it: any) => (
                      <tr key={it.leaseId} className="hover:bg-muted/40">
                        <td className="px-4 py-3 font-medium">{it.leaseNo ?? "--"}</td>
                        <td className="px-4 py-3">{it.branch?.branchName ?? it.branch?.oracleCode ?? "--"}</td>
                        <td className="px-4 py-3">{it.endDate}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">No upcoming expirations in the next 12 months.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Branch Summary</h3>
            <div className="text-xs text-muted-foreground">Leases / Agreement / Monthly / Overdue</div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-muted/90 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Branch</th>
                    <th className="px-4 py-3 text-left">Leases</th>
                    <th className="px-4 py-3 text-left">Agreement</th>
                    <th className="px-4 py-3 text-left">Monthly Expected</th>
                    <th className="px-4 py-3 text-left">Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading...</td></tr>
                  ) : branches?.length ? (
                    branches.map((b: any) => (
                      <tr key={b.branchId} className="hover:bg-muted/40">
                        <td className="px-4 py-3 font-medium">{b.branchName ?? b.oracleCode ?? "--"}</td>
                        <td className="px-4 py-3">{b.leasesCount}</td>
                        <td className="px-4 py-3">{formatCurrency(b.agreementSum)}</td>
                        <td className="px-4 py-3">{formatCurrency(b.monthlyExpected)}</td>
                        <td className="px-4 py-3">{formatCurrency(b.overdue)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No branch data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {Boolean(error) && (
        <div className="rounded-2xl border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">Error loading dashboard data.</div>
      )}
    </section>
  )
}

