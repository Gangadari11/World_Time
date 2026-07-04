import type { ReactNode } from "react"

import { useAuth } from "@/hooks/useAuth"
import type { UserRole } from "@/types/user"

type RoleGateProps = {
    allowedRoles: UserRole[]
    fallback?: ReactNode | null
    children?: ReactNode
}

export function RoleGate({ allowedRoles, fallback = null, children }: RoleGateProps) {
    const { user } = useAuth()

    if (!user) return null

    const role = user.role as UserRole
    if (allowedRoles.includes(role)) return <>{children}</>

    return <>{fallback}</>
}

export default RoleGate
