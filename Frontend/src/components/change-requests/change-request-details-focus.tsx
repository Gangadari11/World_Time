import { useMemo, useState, type ReactNode } from "react"
import { History, ArrowUpRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ChangeRequest } from "@/types/change-request"

type Props = {
  request: ChangeRequest | null
  loading: boolean
  error: unknown
  actionLoading: boolean
  onApprove: (reviewComments?: string) => Promise<void>
  onReject: (reviewComments?: string) => Promise<void>
}

const statusStyles: Record<string, string> = {
  Pending: "border-border bg-muted text-muted-foreground",
  Approved: "border-primary/30 bg-primary/10 text-primary",
  Rejected: "border-destructive/30 bg-destructive/10 text-destructive",
}

type ComparisonRow = {
  path: string
  oldValue: string
  newValue: string
  changed: boolean
}

const EMPTY_VALUE = "-"

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return EMPTY_VALUE
  if (typeof value === "string") return value || '""'
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value)
  }

  if (Array.isArray(value) || isPlainObject(value)) {
    return JSON.stringify(value)
  }

  return String(value)
}

function flattenSnapshot(
  value: unknown,
  prefix = "",
  target = new Map<string, string>()
): Map<string, string> {
  if (isPlainObject(value)) {
    const entries = Object.entries(value)

    if (entries.length === 0 && prefix) {
      target.set(prefix, "{}")
      return target
    }

    entries
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, nested]) => {
        const path = prefix ? `${prefix}.${key}` : key
        flattenSnapshot(nested, path, target)
      })

    return target
  }

  if (Array.isArray(value)) {
    if (!prefix) {
      target.set("(root)", JSON.stringify(value))
      return target
    }

    if (value.length === 0) {
      target.set(prefix, "[]")
      return target
    }

    value.forEach((nested, index) => {
      const path = `${prefix}[${index}]`
      if (isPlainObject(nested) || Array.isArray(nested)) {
        flattenSnapshot(nested, path, target)
      } else {
        target.set(path, formatValue(nested))
      }
    })

    return target
  }

  target.set(prefix || "(root)", formatValue(value))
  return target
}

function buildComparisonRows(oldSnapshot: unknown, newSnapshot: unknown): ComparisonRow[] {
  const oldMap = flattenSnapshot(oldSnapshot)
  const newMap = flattenSnapshot(newSnapshot)
  const allPaths = new Set([...oldMap.keys(), ...newMap.keys()])

  return [...allPaths]
    .sort((a, b) => a.localeCompare(b))
    .map((path) => {
      const oldValue = oldMap.get(path) ?? EMPTY_VALUE
      const newValue = newMap.get(path) ?? EMPTY_VALUE
      return {
        path,
        oldValue,
        newValue,
        changed: oldValue !== newValue,
      }
    })
}

function EmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
      {icon}
      <span>{message}</span>
    </div>
  )
}

export function ChangeRequestDetailsFocus({
  request, loading, error, actionLoading, onApprove, onReject,
}: Props) {
  const [reviewComments, setReviewComments] = useState("")

  const comparisonRows = useMemo(
    () => buildComparisonRows(request?.oldValueSnapshot, request?.newValueSnapshot),
    [request?.oldValueSnapshot, request?.newValueSnapshot]
  )
  const changedRows = useMemo(
    () => comparisonRows.filter((row) => row.changed).length,
    [comparisonRows]
  )

  if (error) return <EmptyState icon={<span className="text-lg">⚠</span>} message="Unable to load request details. Please try again." />
  if (loading) return <EmptyState icon={<span className="animate-spin text-lg">⟳</span>} message="Loading request..." />
  if (!request) return <EmptyState icon={<span className="text-lg">📥</span>} message="Select a request to review" />

  const isPending = request.status === "Pending"
  const reqAt = new Date(request.requestedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
  const revAt = request.reviewedAt
    ? new Date(request.reviewedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
    : null

  return (
    <article className="rounded-2xl border bg-card text-card-foreground shadow-sm">
      <div className="space-y-6 p-5 md:p-7 text-sm">
        <header className="flex items-start justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">#{request.entityChangeRequestId}</span>
              <span className="rounded border bg-muted px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {request.operation}
              </span>
            </div>
            <div className="mt-1 text-base font-medium">
              {request.entitySummary?.name ?? `${request.entityType} #${request.entityId}`}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {request.entityType} · {request.entitySummary?.reference ?? "No reference"} · Submitted {reqAt}
            </div>
          </div>
          <span
            className={cn(
              "mt-0.5 shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium",
              statusStyles[String(request.status)] ?? "bg-muted text-muted-foreground border-border"
            )}
          >
            {request.status}
          </span>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          {[
            {
              label: "Entity",
              name: request.entitySummary?.name ?? `${request.entityType} #${request.entityId}`,
              sub: request.entitySummary?.reference ?? "No reference",
            },
            {
              label: "Requested by",
              name: request.requestedByUser?.fullName ?? `User #${request.requestedBy}`,
              sub: request.requestedByUser?.email ?? "-",
            },
            {
              label: "Reviewed by",
              name: request.reviewedByUser?.fullName ?? "-",
              sub: revAt ?? "Not reviewed",
            },
          ].map(({ label, name, sub }) => (
            <div key={label} className="space-y-1 rounded-lg bg-muted/40 px-3 py-2.5">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
              <div className="truncate font-medium">{name}</div>
              <div className="truncate text-xs text-muted-foreground">{sub}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1 rounded-lg bg-muted/40 px-3 py-2.5">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Requester notes</div>
            <p className="leading-relaxed">{request.requestComments || "No comment"}</p>
          </div>
          <div className="space-y-1 rounded-lg bg-muted/40 px-3 py-2.5">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Reviewer notes</div>
            <p className={cn("leading-relaxed", !request.reviewComments && "text-muted-foreground")}>
              {request.reviewComments || "-"}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <History className="size-3.5" /> Snapshot comparison
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full border bg-background px-2 py-0.5 text-muted-foreground">
                {comparisonRows.length} fields
              </span>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary">
                {changedRows} changed
              </span>
            </div>
          </div>

          {comparisonRows.length > 0 ? (
            <div className="max-h-72 overflow-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="supports-backdrop-filter:bg-background/80 sticky top-0 bg-background/95 backdrop-blur">
                  <tr className="border-b text-muted-foreground">
                    <th className="px-3 py-2 text-left font-medium">Field</th>
                    <th className="px-3 py-2 text-left font-medium">
                      <span className="inline-flex items-center gap-1">
                        <History className="size-3" /> Previous
                      </span>
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      <span className="inline-flex items-center gap-1">
                        <ArrowUpRight className="size-3" /> Requested
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.path} className={cn("border-b", row.changed && "bg-primary/5") }>
                      <td className="max-w-55 px-3 py-2 align-top font-mono text-[11px] text-muted-foreground md:max-w-70">
                        {row.path}
                      </td>
                      <td className={cn("max-w-70 px-3 py-2 align-top wrap-break-word", row.changed && "text-muted-foreground")}>
                        {row.oldValue}
                      </td>
                      <td className={cn("max-w-70 px-3 py-2 align-top wrap-break-word", row.changed && "font-medium")}>
                        {row.newValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-3 py-4 text-xs text-muted-foreground">No snapshot data available for comparison.</div>
          )}
        </section>

        <section className="border-t pt-4">
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <ShieldCheck className="size-3.5" /> Decision
          </div>
          {isPending ? (
            <>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Optional comment..."
                rows={3}
                disabled={actionLoading}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
              />
              <div className="mt-3 flex gap-2">
                <Button
                  disabled={actionLoading}
                  onClick={() => onApprove(reviewComments)}
                  className="cursor-pointer"
                >
                  {actionLoading ? "Submitting..." : "Approve"}
                </Button>
                <Button
                  disabled={actionLoading}
                  onClick={() => onReject(reviewComments)}
                  variant="outline"
                  className="cursor-pointer"
                >
                  Reject
                </Button>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              This request has been <span className="font-medium">{String(request.status).toLowerCase()}</span> and cannot be modified.
            </p>
          )}
        </section>
      </div>
    </article>
  )
}