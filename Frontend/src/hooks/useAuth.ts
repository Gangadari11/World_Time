import { useAuthContext } from "@/contexts/auth/auth-provider"

export function useAuth() {
    return useAuthContext()
}