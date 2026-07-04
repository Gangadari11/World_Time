import type { LeaseStatus } from "@/types/lease"
import type { ChangeRequest } from "@/types/change-request"

export type BranchStatus = "Active" | "Inactive"

export type BranchLease = {
    branchId: number
    leaseNo: string
    lessor: string
    startDate: string
    endDate: string
    leasePropertyAddress: string
    status: LeaseStatus
}

export type Branch = {
    branchId: number
    oracleCode: string
    branchCode: string
    branchName: string
    lessee: string
    status: BranchStatus
    createdAt?: string
    updatedAt?: string
    hasPendingChangeRequest?: boolean
    leases?: BranchLease[]
}

export type CreateBranchInput = {
    branchName: string
    oracleCode: string
    branchCode: string
    lessee: string
    status: BranchStatus
}

export type UpdateBranchInput = CreateBranchInput & {
    branchId: number
    requestComments?: string
}

export type UpdateBranchResult = {
    message: string
    data: ChangeRequest
}

export type DeleteBranchResult = {
    message: string
}