import { apiRequest } from "./client"

import type {
	ChangeRequest,
	GetChangeRequestsParams,
	ReviewChangeRequestInput,
	ReviewChangeRequestResponse,
} from "@/types/change-request"


function toSearchParams(params?: GetChangeRequestsParams) {
	const query = new URLSearchParams()

	if (params?.status) {
		query.set("status", params.status)
	}

	if (params?.entityType) {
		query.set("entityType", params.entityType)
	}

	const value = query.toString()
	return value ? `?${value}` : ""
}

export async function getChangeRequests(params?: GetChangeRequestsParams) {
	return await apiRequest<ChangeRequest[]>(`/entity-change-requests${toSearchParams(params)}`)
}

export async function getChangeRequestById(id: number) {
	return await apiRequest<ChangeRequest>(`/entity-change-requests/${id}`)
}

export async function reviewChangeRequest(id: number, payload: ReviewChangeRequestInput) {
	return await apiRequest<ReviewChangeRequestResponse>(`/entity-change-requests/${id}/review`, {
		method: "POST",
		body: payload,
	})
}

export async function approveChangeRequest(id: number, reviewComments?: string) {
	return await reviewChangeRequest(id, { status: "Approved", reviewComments })
}

export async function rejectChangeRequest(id: number, reviewComments?: string) {
	return await reviewChangeRequest(id, { status: "Rejected", reviewComments })
}

