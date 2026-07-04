import { useCallback, useEffect, useState } from "react"

import { createLease, deleteLease, getLeaseById, getLeases, updateLease } from "@/api/leases.api"
import type { CreateLeaseInput, Lease, UpdateLeaseInput } from "@/types/lease"

type EditLeaseOptions = {
    updateLocalState?: boolean
}

export function useLeases() {
    const [data, setData] = useState<Lease[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<unknown>(null)

    const refresh = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const leases = await getLeases()
            setData(leases)
        } catch (err) {
            setError(err)
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchLease = useCallback(async (id: number) => {
        return await getLeaseById(id)
    }, [])

    const addLease = useCallback(async (payload: CreateLeaseInput) => {
        const created = await createLease(payload)
        setData((current) => [created, ...current])
        return created
    }, [])

    const editLease = useCallback(async (id: number, payload: UpdateLeaseInput, options: EditLeaseOptions = {}) => {
        const request = await updateLease(id, payload)

        const shouldUpdateLocalState = options.updateLocalState ?? true

        let updatedLease: Lease | null = null
        if (shouldUpdateLocalState) {
            setData((current) =>
                current.map((lease) => {
                    if (lease.leaseId !== id) {
                        return lease
                    }

                    updatedLease = {
                        ...lease,
                        branchId: payload.branchId,
                        lessorId: payload.lessorId,
                        leaseNo: payload.leaseNo,
                        leasePropertyAddress: payload.leasePropertyAddress,
                        sqft: payload.sqft,
                        startDate: payload.startDate,
                        endDate: payload.endDate,
                        extensions: payload.extensions,
                        numberOfYears: payload.numberOfYears,
                        rentAdvance: payload.rentAdvance,
                        rentAdvancePeriod: payload.rentAdvancePeriod,
                        refundableDeposit: payload.refundableDeposit,
                        noticePeriodMonths: payload.noticePeriodMonths,
                        remarks: payload.remarks,
                        agreementValue: payload.agreementValue,
                        annualRate: payload.annualRate,
                        utilityBill: payload.utilityBill,
                        whtRate: payload.whtRate,
                        vatRate: payload.vatRate,
                        leaseStatus: payload.leaseStatus,
                        isPaymentAtBeginning: payload.isPaymentAtBeginning,
                    }

                    return updatedLease
                })
            )
        }

        return {
            lease: updatedLease ?? {
            leaseId: id,
            branchId: payload.branchId,
            lessorId: payload.lessorId,
            leaseNo: payload.leaseNo,
            leasePropertyAddress: payload.leasePropertyAddress,
            sqft: payload.sqft,
            startDate: payload.startDate,
            endDate: payload.endDate,
            extensions: payload.extensions,
            numberOfYears: payload.numberOfYears,
            remainingPeriod: null,
            rentAdvance: payload.rentAdvance,
            rentAdvancePeriod: payload.rentAdvancePeriod,
            refundableDeposit: payload.refundableDeposit,
            noticePeriodMonths: payload.noticePeriodMonths,
            remarks: payload.remarks,
            agreementValue: payload.agreementValue,
            annualRate: payload.annualRate,
            utilityBill: payload.utilityBill,
            whtRate: payload.whtRate,
            vatRate: payload.vatRate,
            leaseStatus: payload.leaseStatus,
            isPaymentAtBeginning: payload.isPaymentAtBeginning,
            outstandingReceivableFromLessor: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            branch: null,
            lessor: null,
            paymentSchedules: [],
            },
            request,
        }
    }, [])

    const removeLease = useCallback(async (id: number) => {
        await deleteLease(id)
        setData((current) => current.filter((lease) => lease.leaseId !== id))
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    return {
        data,
        loading,
        error,
        refresh,
        fetchLease,
        addLease,
        editLease,
        removeLease,
    }
}