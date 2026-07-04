import { useMemo, useState } from "react"
import { Loader2, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ChangeRequest } from "@/types/change-request"


type ChangeRequestsTableProps = {
	loading: boolean
	error: unknown
	requests: ChangeRequest[]
	highlightedRequestId?: number | null
	onViewClick: (requestId: number) => void
	onRetry: () => void
}

const statusStyles: Record<string, string> = {
	Pending: "border-primary/30 bg-primary/10 text-primary",
	Approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
	Rejected: "border-rose-500/30 bg-rose-500/10 text-rose-600",
}

export function ChangeRequestsTable({ loading, error, requests, highlightedRequestId = null, onViewClick, onRetry }: ChangeRequestsTableProps) {
	const [searchQuery, setSearchQuery] = useState("")

	const filteredRequests = useMemo(() => {
		const normalized = searchQuery.trim().toLowerCase()
		if (!normalized) {
			return requests
		}

		return requests.filter((request) => {
			const haystack = [
				String(request.entityChangeRequestId),
				String(request.entityId),
				String(request.entityType),
				String(request.operation),
				String(request.status),
				String(request.requestedBy),
			].join(" ").toLowerCase()

			return haystack.includes(normalized)
		})
	}, [requests, searchQuery])

	return (
		<div className="space-y-4 p-1">
			<div className="flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm shadow-xs">
				<input
					value={searchQuery}
					onChange={(event) => setSearchQuery(event.target.value)}
					placeholder="Search by request, entity, status, or requester"
					className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
				/>
			</div>

			<div className="overflow-hidden rounded-xl border">
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead className="border-b bg-muted/90 text-xs uppercase text-muted-foreground">
							<tr>
								<th className="px-4 py-3 text-left">Request ID</th>
								<th className="px-4 py-3 text-left">Entity</th>
								<th className="px-4 py-3 text-left">Operation</th>
								<th className="px-4 py-3 text-left">Status</th>
								<th className="px-4 py-3 text-left">Requested By</th>
								<th className="px-4 py-3 text-left">Requested At</th>
								<th className="px-4 py-3 text-left">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{loading ? (
								<tr>
									<td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
										<div className="flex items-center gap-3 justify-center">
											<Loader2 className="size-4 animate-spin" />
											<span>Loading requests...</span>
										</div>
									</td>
								</tr>
							) : error ? (
								<tr>
									<td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
										<div className="flex items-center gap-2 justify-center">
											<span>Unable to load requests.</span>
											<Button
												size="sm"
												variant="link"
												className="hover:text-foreground cursor-pointer underline"
												onClick={onRetry}
											>
												Retry
												<RotateCw className="size-3.5" />
											</Button>
										</div>
									</td>
								</tr>
							) : filteredRequests.length > 0 ? (
								filteredRequests.map((request) => {
									const isHighlighted = highlightedRequestId === request.entityChangeRequestId

									return (
										<tr
											id={`change-request-${request.entityChangeRequestId}`}
											key={request.entityChangeRequestId}
											className={cn(
												"transition-colors hover:bg-muted/50",
												isHighlighted && "bg-amber-100/50 ring-1 ring-amber-400/60"
											)}
										>
											<td className="px-4 py-3 font-medium">#{request.entityChangeRequestId}</td>
											<td className="px-4 py-3">
												<div className="font-medium">{request.entityType}</div>
												<div className="text-xs text-muted-foreground">{request.entitySummary?.reference}</div>
												{isHighlighted ? (
													<div className="mt-1 inline-flex rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800">
														From notification
													</div>
												) : null}
											</td>
											<td className="px-4 py-3">{request.operation}</td>
											<td className="px-4 py-3">
												<span
													className={cn(
														"inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
														statusStyles[String(request.status)] ?? "border-muted-foreground/20 bg-muted text-muted-foreground"
													)}
												>
													{request.status}
												</span>
											</td>
											<td className="px-4 py-3">
												<div className="font-medium">{request.requestedByUser?.fullName}</div>
												<div className="text-xs text-muted-foreground">{request.requestedByUser?.email}</div>
											</td>
											<td className="px-4 py-3">
												{new Date(request.requestedAt).toLocaleString()}
											</td>
											<td className="px-4 py-3">
												<Button
													size="sm"
													variant="outline"
													className="cursor-pointer"
													onClick={() => onViewClick(request.entityChangeRequestId)}
												>
													View
												</Button>
											</td>
										</tr>
									)
								})
							) : (
								<tr>
									<td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
										No change requests found.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
