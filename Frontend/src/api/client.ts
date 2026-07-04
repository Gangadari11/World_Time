const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5127/api"

type AuthUser = {
    userId: number
    role: string
    fullName: string
}

type RefreshResponse = {
    accessToken: string
    userId: number
    role: string
    fullName: string
}

type SessionHandlers = {
    onSessionRefreshed?: (token: string, user: AuthUser) => void
    onSessionExpired?: () => void
}

type ApiOptions = {
    method?: "GET" | "POST" | "PUT" | "DELETE"
    body?: unknown
    headers?: Record<string, string>
}

let sessionHandlers: SessionHandlers = {}
let refreshPromise: Promise<RefreshResponse> | null = null

export function setSessionHandlers(handlers: SessionHandlers) {
    sessionHandlers = handlers
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}, allowRefresh = true): Promise<T> {
    const { method = "GET", body, headers = {} } = options

    const token = localStorage.getItem("accessToken")

    const res = await fetch(`${baseUrl}${path}`, {
        method,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    })

    if (res.status === 401 && allowRefresh) {
        const refreshed = await tryRefreshToken()
        if (refreshed) {
            storeSession(refreshed)
            return apiRequest<T>(path, options, false)
        }
        clearStoredSession()
    }

    if (!res.ok) {
        const message = await safeReadError(res)
        throw new Error(message || `Request failed with ${res.status}`)
    }

    return (await res.json()) as T
}

async function tryRefreshToken() {
    if (!refreshPromise) {
        refreshPromise = refreshTokenRequest().finally(() => {
            refreshPromise = null
        })
    }

    try {
        return await refreshPromise
    } catch {
        return null
    }
}

async function refreshTokenRequest(): Promise<RefreshResponse> {
    // call refresh endpoint with current access token
    const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,   
        },
    })

    if (!res.ok) {
        const message = await safeReadError(res)
        throw new Error(message || `Request failed with ${res.status}`)
    }

    return (await res.json()) as RefreshResponse
}

function storeSession(payload: RefreshResponse) {
    const user = {
        userId: payload.userId,
        role: payload.role,
        fullName: payload.fullName,
    }

    localStorage.setItem("accessToken", payload.accessToken)
    localStorage.setItem("user", JSON.stringify(user))
    sessionHandlers.onSessionRefreshed?.(payload.accessToken, user)
}

function clearStoredSession() {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("user")
    sessionHandlers.onSessionExpired?.()
}

// TODO: Match with backend error format
async function safeReadError(res: Response) {
    try {
        const data = await res.json()
        return data?.message || data?.error || ""
    } catch {
        return ""
    }
}