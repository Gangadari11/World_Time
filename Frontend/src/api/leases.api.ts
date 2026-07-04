import { apiRequest } from "./client"

import type { CreateLeaseInput, Lease, UpdateLeaseInput } from "@/types/lease"
import type { CashflowResponse, CashflowSummary } from "@/types/cashflow"
import type { ChangeRequest } from "@/types/change-request"

type UpdateLeaseResponse = {
    message: string
    data: ChangeRequest
}

export async function getLeases() {
    return await apiRequest<Lease[]>("/leases")
}

export async function getLeaseById(id: number) {
    return await apiRequest<Lease>(`/leases/${id}`)
}

export async function getLeasePaymentCashflows(id: number) {
    return await apiRequest<CashflowResponse>(`/leases/${id}/payment-cashflows`)
}

export async function getLeasePaymentCashflowSummary(id: number) {
    return await apiRequest<CashflowSummary>(`/leases/${id}/payment-cashflow-summary`)
}

export async function getLeasePaymentCashflowsByYear(id: number, year: number) {
    return await apiRequest<CashflowResponse>(`/leases/${id}/cashflow-year/${year}`)
}

export async function createLease(payload: CreateLeaseInput) {
    return await apiRequest<Lease>("/leases", {
        method: "POST",
        body: payload,
    })
}

export async function updateLease(id: number, payload: UpdateLeaseInput) {
    const response = await apiRequest<UpdateLeaseResponse>(`/leases/${id}`, {
        method: "PUT",
        body: payload,
    })

    return response.data
}

export async function deleteLease(id: number) {
    return await apiRequest(`/leases/${id}`, {
        method: "DELETE",
    })
}
