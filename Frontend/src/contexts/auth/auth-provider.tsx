import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { login, logout, refreshToken } from "@/api/auth.api"
import { setSessionHandlers } from "@/api/client"

type AuthUser = {
    userId: number
    role: string
    fullName: string
}

type AuthContextValue = {
    accessToken: string | null
    user: AuthUser | null
    isAuthenticated: boolean
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    refreshAuthToken: () => Promise<void>
}

type StoredUser = AuthUser

type AuthProviderProps = {
    children: React.ReactNode
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function loadStoredUser(): StoredUser | null {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
        return null
    }
    try {
        return JSON.parse(storedUser) as StoredUser
    } catch {
        return null
    }
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem("accessToken"))
    const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser())
    const [loading, setLoading] = useState(false)

    const persistSession = useCallback((token: string, nextUser: AuthUser) => {
        setAccessToken(token)
        setUser(nextUser)
        localStorage.setItem("accessToken", token)
        localStorage.setItem("user", JSON.stringify(nextUser))
    }, [])

    const clearSession = useCallback(() => {
        setAccessToken(null)
        setUser(null)
        localStorage.removeItem("accessToken")
        localStorage.removeItem("user")
    }, [])

    useEffect(() => {
        setSessionHandlers({
            onSessionRefreshed: persistSession,
            onSessionExpired: clearSession,
        })

        return () => {
            setSessionHandlers({})
        }
    }, [clearSession, persistSession])

    const signIn = useCallback(async (email: string, password: string) => {
        setLoading(true)
        try {
            const { accessToken, userId, role, fullName } = await login({ email, password })
            persistSession(accessToken, { userId, role, fullName })
        } catch (error) {
            clearSession()
            throw error
        } finally {
            setLoading(false)
        }
    }, [clearSession, persistSession])

    const signOut = useCallback(async () => {
        try {
            await logout()
        } finally {
            clearSession()
        }
    }, [clearSession])

    const refreshAuthToken = useCallback(async () => {
        setLoading(true)
        try {
            const { accessToken, userId, role, fullName } = await refreshToken()
            persistSession(accessToken, { userId, role, fullName })
        } catch (error) {
            clearSession()
            throw error
        } finally {
            setLoading(false)
        }
    }, [clearSession, persistSession])

    const value = useMemo<AuthContextValue>(() => ({
        accessToken,
        user,
        isAuthenticated: Boolean(accessToken),
        loading,
        signIn,
        signOut,
        refreshAuthToken,
    }), [accessToken, user, loading, signIn, signOut, refreshAuthToken])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuthContext must be used within AuthProvider")
    }
    return context
}
