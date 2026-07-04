import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"


export function LogoutPage() {
    const { signOut } = useAuth()
    const { addToast } = useToast()
    const navigate = useNavigate()

    useEffect(() => {
        let isActive = true

        signOut().then(() => {
            if (!isActive) {
                return
            }
            addToast({
                title: "Signed out",
                description: "You have been successfully signed out.",
                type: "success",
            })
            navigate("/login", { replace: true })
        })

        return () => {
            isActive = false
        }
    }, [addToast, navigate, signOut])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 bg-transparent px-5 py-4 text-sm text-white">
                <Loader2 className="size-4 animate-spin" />
                <span>Signing out...</span>
            </div>
        </div>
    )
}
