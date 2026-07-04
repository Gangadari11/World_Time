import { useState } from "react"
import { canRegisterFirstAdmin, createInitialAdmin } from "@/api/auth.api"

type AdminSetupResult = { ok: true } | { ok: false; message: string }

export function useAdminSetup() {
    const [setupLoading, setSetupLoading] = useState(false)
    const [setupError, setSetupError] = useState<string | null>(null)
    
    const [createLoading, setCreateLoading] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)
    const [createSuccess, setCreateSuccess] = useState(false)

    async function checkAdminSetup(): Promise<boolean> {
        setSetupLoading(true)
        setSetupError(null)
        try {
            const { canRegister } = await canRegisterFirstAdmin()
            return canRegister
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to check setup status."
            setSetupError(message)
            throw err
        } finally {
            setSetupLoading(false)
        }
    }
    
    async function createAdmin(fullName: string, email: string, password: string): Promise<AdminSetupResult> {
        setCreateLoading(true)
        setCreateError(null)
        setCreateSuccess(false)
        try {
            await createInitialAdmin({ fullName, email, password, role: "Admin" })
            setCreateSuccess(true)
            return { ok: true }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to create admin account."
            setCreateError(message)
            return { ok: false, message }
        } finally {
            setCreateLoading(false)
        }
    }

    function clearCreateError() {
        setCreateError(null)
    }

    function clearSetupError() {
        setSetupError(null)
    }

    return {
        setupLoading,
        setupError,
        createLoading,
        createError,
        createSuccess,
        createAdmin,
        clearCreateError,
        clearSetupError,
        checkAdminSetup,
    }
}