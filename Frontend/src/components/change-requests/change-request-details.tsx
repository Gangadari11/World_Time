import { useMemo, useState } from "react"
import { Loader2, MessageSquareText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InfoCard } from "@/components/ui/info-card"
import { cn } from "@/lib/utils"
import type { ChangeRequest } from "@/types/change-request"


type ChangeRequestDetailsProps = {
	request: ChangeRequest | null
	loading: boolean
	error: unknown
	actionLoading: boolean
	onApprove: (reviewComments?: string) => Promise<void>
	onReject: (reviewComments?: string) => Promise<void>
}

const statusStyles: Record<string, string> = {
	Pending: "border-primary/30 bg-primary/10 text-primary",
	Approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
	Rejected: "border-rose-500/30 bg-rose-500/10 text-rose-600",
}

export function ChangeRequestDetails({
	request,
	loading,
	error,
	actionLoading,
	onApprove,
	onReject,
}: ChangeRequestDetailsProps) {
	const [reviewComments, setReviewComments] = useState("")

	const prettyOldSnapshot = useMemo(() => {
		if (!request?.oldValueSnapshot) {
			return "No previous snapshot."
		}
		return JSON.stringify(request.oldValueSnapshot, null, 2)
	}, [request?.oldValueSnapshot])

	const prettyNewSnapshot = useMemo(() => {
		if (!request?.newValueSnapshot) {
			return "No new snapshot."
		}
		return JSON.stringify(request.newValueSnapshot, null, 2)
	}, [request?.newValueSnapshot])

	if (error) {
		return (
			<div className="rounded-xl border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
				Unable to load request details. Please try again later.
			</div>
		)
	}

	if (loading) {
		return (
			<div className="rounded-xl border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
				<div className="flex items-center gap-3 justify-center">
					<Loader2 className="size-4 animate-spin" />
					<span>Loading request details...</span>
				</div>
			</div>
		)
	}

	if (!request) {
		return (
			<div className="rounded-xl border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
				Select a request from the list to review the changes.
			</div>
		)
	}

	const isPending = request.status === "Pending"

	return (
		<div className="space-y-6 p-1">
			<div className="grid gap-4 lg:grid-cols-2">
				<InfoCard
					title="Request Overview"
					icon={<MessageSquareText className="size-4 text-muted-foreground" />}
					items={[
						{ label: "Request ID", value: `#${request.entityChangeRequestId}` },
						{ label: "Entity", value: `${request.entityType} #${request.entityId}` },
						{ label: "Operation", value: request.operation },
						{ label: "Requested By", value: `User #${request.requestedBy}` },
						{ label: "Requested At", value: new Date(request.requestedAt).toLocaleString() },
						{ label: "Status", value: (
							<span
								className={cn(
									"inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
									statusStyles[String(request.status)] ?? "border-muted-foreground/20 bg-muted text-muted-foreground"
								)}
							>
								{request.status}
							</span>
						) },
					]}
				/>

				<InfoCard
					title="Review Notes"
					icon={<MessageSquareText className="size-4 text-muted-foreground" />}
					items={[
						{ label: "Requester comment", value: request.requestComments || "No comment" },
						{ label: "Reviewer", value: request.reviewedBy ? `User #${request.reviewedBy}` : "Not reviewed" },
						{ label: "Reviewed At", value: request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : "-" },
						{ label: "Review comment", value: request.reviewComments || "-" },
					]}
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<div className="rounded-2xl border p-5">
					<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Previous values</h3>
					<pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-muted/40 p-3 text-xs text-foreground">
						{prettyOldSnapshot}
					</pre>
				</div>
				<div className="rounded-2xl border p-5">
					<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Requested values</h3>
					<pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-muted/40 p-3 text-xs text-foreground">
						{prettyNewSnapshot}
					</pre>
				</div>
			</div>

			<div className="rounded-2xl border p-5">
				<label className="text-sm font-semibold text-muted-foreground">Review comment</label>
				<textarea
					value={reviewComments}
					onChange={(event) => setReviewComments(event.target.value)}
					placeholder="Optional comment for approval or rejection"
					className="mt-3 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
					rows={3}
					disabled={!isPending || actionLoading}
				/>
				<div className="mt-4 flex flex-wrap gap-3">
					<Button
						disabled={!isPending || actionLoading}
						className="cursor-pointer"
						onClick={() => onApprove(reviewComments)}
					>
						{actionLoading ? "Submitting..." : "Approve"}
					</Button>
					<Button
						variant="outline"
						disabled={!isPending || actionLoading}
						className="cursor-pointer"
						onClick={() => onReject(reviewComments)}
					>
						Reject
					</Button>
				</div>
			</div>
		</div>
	)
}
