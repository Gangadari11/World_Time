import { apiRequest } from "./client"

import type { CreateLessorInput, Lessor, UpdateLessorInput } from "@/types/lessor"
import type { ChangeRequest } from "@/types/change-request"

type UpdateLessorResponse = {
    message: string
    data: ChangeRequest
}

export async function getLessors() {
    return await apiRequest<Lessor[]>("/lessors")
}

export async function getLessorById(id: number) {
    return await apiRequest<Lessor>(`/lessors/${id}`)
}

export async function createLessor(payload: CreateLessorInput) {
    return await apiRequest<Lessor>("/lessors", {
        method: "POST",
        body: payload,
    })
}

export async function updateLessor(id: number, payload: UpdateLessorInput) {
    const response = await apiRequest<UpdateLessorResponse>(`/lessors/${id}`, {
        method: "PUT",
        body: payload,
    })

    return response.data
}

export async function deleteLessor(id: number) {
    return await apiRequest(`/lessors/${id}`, {
        method: "DELETE",
    })
}