import type { LeaseStatus } from "@/types/lease"
export type LessorLease = {
    leaseId: number
    leaseNo: string | null
    leasePropertyAddress: string | null
    startDate: string | null
    endDate: string | null
    agreementValue: number | string | null
    annualRate: number | string | null
    leaseStatus: LeaseStatus | null
}

export type Lessor = {
    lessorId: number
    fullName: string | null
    nic: string | null
    address: string | null
    bankName: string | null
    accountNumber: string | null
    bankCode: string | null
    createdAt: string
    updatedAt: string
    leases?: LessorLease[]
}

export type CreateLessorInput = {
    fullName: string
    nic: string
    address: string
    bankName: string
    accountNumber: string
    bankCode: string
}

export type UpdateLessorInput = CreateLessorInput & {
    lessorId: number
}