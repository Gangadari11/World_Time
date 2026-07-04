import type { Lessor} from "@/types/lessor"
export type LeaseStatus = "Active" | "Terminate"


export type LeaseBranch = {
    branchId: number
    oracleCode: string | null
    branchCode: string | null
    branchName: string | null
    lessee: string | null
    status: string | null
    createdAt: string
    updatedAt: string
}

export type LeasePaymentSchedule = {
    paymentScheduleId: number
    leaseId: number | null
    leaseYear: number | null
    grossAmount: number | null
    createdAt: string
    updatedAt: string
}

export type LeasePaymentScheduleInput = {
    leaseYear: number
    grossAmount: number
}

export type Lease = {
    leaseId: number
    branchId: number | null
    lessorId: number | null
    leaseNo: string | null
    leasePropertyAddress: string | null
    sqft: number | null
    startDate: string | null
    endDate: string | null
    extensions: string | null
    numberOfYears: number | null
    remainingPeriod: string | null
    rentAdvance: number | null
    rentAdvancePeriod: number | null
    refundableDeposit: number | null
    noticePeriodMonths: number | null
    remarks: string | null
    agreementValue: number | null
    annualRate: number | null
    utilityBill: number | null
    whtRate: number | null
    vatRate: number | null
    leaseStatus: LeaseStatus | string | null
    isPaymentAtBeginning: boolean
    outstandingReceivableFromLessor: number | null
    createdAt: string
    updatedAt: string
    branch: LeaseBranch | null
    lessor: Lessor | null
    paymentSchedules: LeasePaymentSchedule[]
}

export type CreateLeaseInput = {
    branchId: number
    lessorId: number
    leaseNo: string
    leasePropertyAddress: string
    sqft: number
    startDate: string
    endDate: string
    extensions: string
    numberOfYears: number
    rentAdvance: number
    rentAdvancePeriod: number
    refundableDeposit: number
    noticePeriodMonths: number
    remarks: string
    agreementValue: number
    annualRate: number
    utilityBill: number
    whtRate: number
    vatRate: number
    leaseStatus: LeaseStatus
    isPaymentAtBeginning: boolean
    paymentSchedules: LeasePaymentScheduleInput[]
}

export type UpdateLeaseInput = Omit<CreateLeaseInput, "paymentSchedules"> & {
    leaseId: number
}