import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"


export function SignInForm() {
    const [formValues, setFormValues] = useState({
        email: "",
        password: "",
    })
    const [error, setError] = useState<string | null>(null)

    const navigate = useNavigate()
    const { signIn, loading } = useAuth()
    const { addToast } = useToast()

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        try {
            await signIn(formValues.email, formValues.password)
            addToast({
                title: "Success",
                description: "You have successfully signed in.",
                type: "success",
            })
            navigate("/dashboard", { replace: true })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to sign in.")
            addToast({
                title: "Error",
                description: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
                type: "error",
            })
        }
    }

    return (
        <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formValues.email}
                    onChange={(event) => {
                        setFormValues((prev) => ({ ...prev, email: event.target.value }))
                        setError(null)
                    }}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                    Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={formValues.password}
                    onChange={(event) =>
                        setFormValues((prev) => ({ ...prev, password: event.target.value }))
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                />
            </div>

            {error ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                    Accounts are managed by administrators.
                </span>
                <Button type="button" variant="link" className="h-auto px-0 cursor-pointer">
                    Forgot password?
                </Button>
            </div>

            <Button type="submit" size="lg" className="w-full cursor-pointer" disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
            </Button>
        </form>
    )
}