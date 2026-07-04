import { useEffect, useMemo, useState } from "react"
import { ShieldCheck } from "lucide-react"
import { useSearchParams } from "react-router-dom"

import { PageHeader } from "@/components/ui/page-header"
import { HorizontalTabs } from "@/components/ui/horizontal-tabs"
import { ChangeRequestsTable } from "@/components/change-requests/change-requests-table"
import { ChangeRequestDetailsFocus } from "@/components/change-requests/change-request-details-focus"
import { useChangeRequests } from "@/hooks/useChangeRequests"
import { useToast } from "@/hooks/useToast"
import type { ChangeRequest } from "@/types/change-request"


export function ChangeRequestsPage() {
	const [searchParams] = useSearchParams()
	const [activeTab, setActiveTab] = useState<"list" | "details">("list")
	const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
	const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null)

	const highlightedRequestId = useMemo(() => {
		const value = searchParams.get("requestId")
		if (!value) {
			return null
		}

		const requestId = Number(value)
		if (!Number.isInteger(requestId) || requestId <= 0) {
			return null
		}

		return requestId
	}, [searchParams])

	const {
		data,
		loading,
		detailsLoading,
		actionLoading,
		fetchError,
		detailsError,
		reviewRequest,
		refresh,
		fetchRequest,
	} = useChangeRequests({ status: "Pending" })

	const { addToast } = useToast()

	const selectedRequestFromList = useMemo(() => {
		if (!selectedRequestId) {
			return null
		}
		return data.find((request) => request.entityChangeRequestId === selectedRequestId) ?? null
	}, [data, selectedRequestId])

	useEffect(() => {
		if (!selectedRequestId || activeTab !== "details") {
			setSelectedRequest(null)
			return
		}

		const loadDetails = async () => {
			try {
				const request = await fetchRequest(selectedRequestId)
				setSelectedRequest(request)
			} catch (error) {
				addToast({
					title: "Unable to load request",
					description: error instanceof Error ? error.message : "Failed to load request details.",
					type: "error",
				})
			}
		}

		loadDetails()
	}, [activeTab, addToast, fetchRequest, selectedRequestId])

	useEffect(() => {
		if (fetchError) {
			addToast({
				title: "Unable to load requests",
				description: fetchError instanceof Error ? fetchError.message : "Failed to load change requests.",
				type: "error",
			})
		}
	}, [addToast, fetchError])

	useEffect(() => {
		if (!highlightedRequestId || loading || data.length === 0) {
			return
		}

		const row = document.getElementById(`change-request-${highlightedRequestId}`)
		if (row) {
			row.scrollIntoView({ behavior: "smooth", block: "center" })
		}
	}, [data.length, highlightedRequestId, loading])

	const handleView = (requestId: number) => {
		setSelectedRequestId(requestId)
		setActiveTab("details")
	}

	const handleApprove = async (reviewComments?: string) => {
		if (!selectedRequestId) {
			return
		}
		try {
			const result = await reviewRequest(selectedRequestId, { status: "Approved", reviewComments })
			setSelectedRequest(result.data)
			addToast({
				title: "Request approved",
				description: "The changes were applied successfully.",
				type: "success",
			})
		} catch (error) {
			addToast({
				title: "Approval failed",
				description: error instanceof Error ? error.message : "Unable to approve the request.",
				type: "error",
			})
		}
	}

	const handleReject = async (reviewComments?: string) => {
		if (!selectedRequestId) {
			return
		}
		try {
			const result = await reviewRequest(selectedRequestId, { status: "Rejected", reviewComments })
			setSelectedRequest(result.data)
			addToast({
				title: "Request rejected",
				description: "The submitter has been notified.",
				type: "success",
			})
		} catch (error) {
			addToast({
				title: "Rejection failed",
				description: error instanceof Error ? error.message : "Unable to reject the request.",
				type: "error",
			})
		}
	}

	return (
		<section className="mx-auto w-full max-w-6xl space-y-6">
			<PageHeader
				title="Approval Center"
				description="Review and approve updates submitted by the team."
				actions={
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<ShieldCheck className="size-4" />
						<span>{data.length} pending requests</span>
					</div>
				}
			/>

			<HorizontalTabs
				tabs={[
					{ value: "list", label: "Pending Requests" },
					{ value: "details", label: "Request Details" },
				]}
				value={activeTab}
				onChange={(value) => setActiveTab(value as "list" | "details")}
			/>

			{activeTab === "list" ? (
				<ChangeRequestsTable
					loading={loading}
					error={fetchError}
					requests={data}
					highlightedRequestId={highlightedRequestId}
					onViewClick={handleView}
					onRetry={() => refresh()}
				/>
			) : (
				<ChangeRequestDetailsFocus
					request={selectedRequest ?? selectedRequestFromList}
					loading={detailsLoading}
					error={detailsError}
					actionLoading={actionLoading}
					onApprove={handleApprove}
					onReject={handleReject}
				/>
			)}
		</section>
	)
}
