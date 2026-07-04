import { apiRequest } from "./client"
import type { 
    Branch, 
    CreateBranchInput, 
    UpdateBranchInput, 
    UpdateBranchResult, 
    DeleteBranchResult 
} from "@/types/branch"


export async function getBranches() {
    return await apiRequest<Branch[]>("/branches")
}

export async function getBranchById(id: number) {
    return await apiRequest<Branch>(`/branches/${id}`)
}

export async function createBranch(payload: CreateBranchInput) {
    return await apiRequest<Branch>("/branches", {
        method: "POST",
        body: payload
    })
}

export async function updateBranch(id: number, payload: UpdateBranchInput) {
    const result = await apiRequest<UpdateBranchResult>(`/branches/${id}`, {
        method: "PUT",
        body: payload
    })
    return result.data
}

export async function deleteBranch(id: number) {
    return await apiRequest<DeleteBranchResult>(`/branches/${id}`, {
        method: "DELETE"
    })
}
