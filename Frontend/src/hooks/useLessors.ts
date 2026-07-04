import { useCallback, useEffect, useState } from "react"

import {
    createLessor,
    deleteLessor,
    getLessorById,
    getLessors,
    updateLessor,
} from "@/api/lessors.api"
import type { CreateLessorInput, Lessor, UpdateLessorInput } from "@/types/lessor"

type EditLessorOptions = {
    updateLocalState?: boolean
}

export function useLessors() {
    const [data, setData] = useState<Lessor[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<unknown>(null)

    const refresh = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const lessors = await getLessors()
            setData(lessors)
        } catch (err) {
            setError(err)
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchLessor = useCallback(async (id: number) => {
        return await getLessorById(id)
    }, [])

    const addLessor = useCallback(async (payload: CreateLessorInput) => {
        const created = await createLessor(payload)
        setData((current) => [created, ...current])
        return created
    }, [])

    const editLessor = useCallback(async (id: number, payload: UpdateLessorInput, options: EditLessorOptions = {}) => {
        const request = await updateLessor(id, payload)

        const shouldUpdateLocalState = options.updateLocalState ?? true

        let updatedLessor: Lessor | null = null
        if (shouldUpdateLocalState) {
            setData((current) =>
                current.map((lessor) => {
                    if (lessor.lessorId !== id) {
                        return lessor
                    }

                    updatedLessor = {
                        ...lessor,
                        fullName: payload.fullName,
                        nic: payload.nic,
                        address: payload.address,
                        bankName: payload.bankName,
                        accountNumber: payload.accountNumber,
                        bankCode: payload.bankCode,
                    }

                    return updatedLessor
                })
            )
        }

        return {
            lessor: updatedLessor ?? {
            lessorId: id,
            fullName: payload.fullName,
            nic: payload.nic,
            address: payload.address,
            bankName: payload.bankName,
            accountNumber: payload.accountNumber,
            bankCode: payload.bankCode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            },
            request,
        }
    }, [])

    const removeLessor = useCallback(async (id: number) => {
        await deleteLessor(id)
        setData((current) => current.filter((lessor) => lessor.lessorId !== id))
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    return {
        data,
        loading,
        error,
        refresh,
        fetchLessor,
        addLessor,
        editLessor,
        removeLessor,
    }
}