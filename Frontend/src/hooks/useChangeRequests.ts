import { useCallback, useEffect, useMemo, useState } from "react"

import {
	getChangeRequests,
	getChangeRequestById,
	approveChangeRequest,
	rejectChangeRequest,
} from "@/api/change-requests.api"
import { useAuth } from "@/hooks/useAuth"
import type {
	ChangeRequest,
	ChangeRequestEntityType,
	ChangeRequestStatus,
	GetChangeRequestsParams,
	ReviewChangeRequestInput,
} from "@/types/change-request"


type UseChangeRequestsOptions = {
	autoLoad?: boolean
	status?: ChangeRequestStatus
	entityType?: ChangeRequestEntityType
}

type LoadChangeRequestsParams = GetChangeRequestsParams & {
	refreshSelectedRequest?: boolean
}

export function useChangeRequests(options: UseChangeRequestsOptions = {}) {
	const { user } = useAuth()
	const currentUserId = user?.userId ?? null

	const [data, setData] = useState<ChangeRequest[]>([])
	
    const [loading, setLoading] = useState(false)
	const [detailsLoading, setDetailsLoading] = useState(false)
	const [actionLoading, setActionLoading] = useState(false)
	
    const [fetchError, setFetchError] = useState<unknown>(null)
	const [detailsError, setDetailsError] = useState<unknown>(null)
	const [actionError, setActionError] = useState<unknown>(null)

	const baseFilters = useMemo<GetChangeRequestsParams>(() => ({
		status: options.status,
		entityType: options.entityType,
	}), [options.entityType, options.status])

	const refresh = useCallback(async (params?: GetChangeRequestsParams) => {
		setLoading(true)
		setFetchError(null)

		try {
			const requests = await getChangeRequests({ ...baseFilters, ...params })
			setData(requests)
			return requests
		} catch (error) {
			setFetchError(error)
			throw error
		} finally {
			setLoading(false)
		}
	}, [baseFilters])

	const refreshWith = useCallback(async (params: LoadChangeRequestsParams = {}) => {
		const { refreshSelectedRequest: _refreshSelectedRequest, ...filters } = params
		return await refresh(filters)
	}, [refresh])

	const fetchRequest = useCallback(async (id: number) => {
		setDetailsLoading(true)
		setDetailsError(null)

		try {
			return await getChangeRequestById(id)
		} catch (error) {
			setDetailsError(error)
			throw error
		} finally {
			setDetailsLoading(false)
		}
	}, [])

	const reviewRequest = useCallback(async (id: number, payload: ReviewChangeRequestInput) => {
		setActionLoading(true)
		setActionError(null)

		try {
			const result = payload.status === "Approved"
				? await approveChangeRequest(id, payload.reviewComments)
				: await rejectChangeRequest(id, payload.reviewComments)

			setData((current) => current.map((request) => (
				request.entityChangeRequestId === id ? result.data : request
			)))
			return result
		} catch (error) {
			setActionError(error)
			throw error
		} finally {
			setActionLoading(false)
		}
	}, [])

	const approveRequest = useCallback(async (id: number, reviewComments?: string) => {
		return await reviewRequest(id, { status: "Approved", reviewComments })
	}, [reviewRequest])

	const rejectRequest = useCallback(async (id: number, reviewComments?: string) => {
		return await reviewRequest(id, { status: "Rejected", reviewComments })
	}, [reviewRequest])

	const refreshPendingOnly = useCallback(async () => {
		return await refresh({ status: "Pending" })
	}, [refresh])

	const myRequests = useMemo(() => {
		if (!currentUserId) {
			return []
		}

		return data.filter((request) => request.requestedBy === currentUserId)
	}, [currentUserId, data])

	const pendingRequests = useMemo(() => data.filter((request) => request.status === "Pending"), [data])

	const approvedRequests = useMemo(() => data.filter((request) => request.status === "Approved"), [data])

	const rejectedRequests = useMemo(() => data.filter((request) => request.status === "Rejected"), [data])

	useEffect(() => {
		if (options.autoLoad ?? true) {
			void refresh()
		}
	}, [options.autoLoad, refresh])

	return {
		data,
		myRequests,
		pendingRequests,
		approvedRequests,
		rejectedRequests,
		currentUserId,
		loading,
		detailsLoading,
		actionLoading,
		fetchError,
		detailsError,
		actionError,
		refresh,
		refreshWith,
		refreshPendingOnly,
		fetchRequest,
		reviewRequest,
		approveRequest,
		rejectRequest,
		setData,
	}
}
