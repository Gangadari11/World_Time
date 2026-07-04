import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/hooks/useAuth"
import type { UserRole } from "@/types/user"

type ProtectedRouteProps = {
    children?: ReactNode
    redirectTo?: string
    allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, redirectTo = "/login", allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, loading, user } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="flex items-center gap-3 bg-transparent px-5 py-4 text-sm text-white">
                    <Loader2 className="size-4 animate-spin" />
                    <span>Checking session...</span>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to={redirectTo} replace state={{ from: location }} />
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const role = user?.role as UserRole | undefined
        const allowed = role ? allowedRoles.includes(role) : false
        if (!allowed) {
            return <Navigate to="/dashboard" replace />
        }
    }

    if (children) {
        return <>{children}</>
    }

    return <Outlet />
}
