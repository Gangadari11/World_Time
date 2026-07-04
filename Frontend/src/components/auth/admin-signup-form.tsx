import { useState } from "react"

import { Button } from "@/components/ui/button"
import { useAdminSetup } from "@/hooks/useAdminSetup"
import { useToast } from "@/hooks/useToast"


type InitialAdminSetupFormProps = {
    onCreated: () => void
}

export function InitialAdminSetupForm({ onCreated }: InitialAdminSetupFormProps) {
    const [formValues, setFormValues] = useState({
        fullName: "",
        email: "",
        password: "",
    })
    
    const { addToast } = useToast()
    const { createAdmin, createLoading, createError, createSuccess, clearCreateError } = useAdminSetup()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const result = await createAdmin(formValues.fullName, formValues.email, formValues.password)
        if (result.ok) {
            addToast({
                title: "Success",
                description: "Admin account created successfully. You can now sign in.",
                type: "success",
            })
            onCreated()
        } else {
            setFormValues((prev) => ({ ...prev, password: "" }))
            addToast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                type: "error",
            })
        }
    }

    return (
        <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                    Full name
                </label>
                <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    disabled={createSuccess}
                    placeholder="Enter your full name"
                    value={formValues.fullName}
                    onChange={(event) => {
                        setFormValues((prev) => ({ ...prev, fullName: event.target.value }))
                        createError && clearCreateError()
                    }}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="adminEmail" className="text-sm font-medium">
                    Email
                </label>
                <input
                    id="adminEmail"
                    name="email"
                    type="email"
                    required
                    disabled={createSuccess}
                    placeholder="name@company.com"
                    value={formValues.email}
                    onChange={(event) => {
                        setFormValues((prev) => ({ ...prev, email: event.target.value }))
                        createError && clearCreateError()
                    }}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="adminPassword" className="text-sm font-medium">
                    Password
                </label>
                <input
                    id="adminPassword"
                    name="password"
                    type="password"
                    required
                    disabled={createSuccess}
                    placeholder="Create a secure password"
                    value={formValues.password}
                    onChange={(event) => {
                        setFormValues((prev) => ({ ...prev, password: event.target.value }))
                        createError && clearCreateError()
                    }}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="adminRole" className="text-sm font-medium">
                    Role
                </label>
                <input
                    id="adminRole"
                    name="role"
                    type="text"
                    disabled
                    value="Admin"
                    className="w-full rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground shadow-xs"
                />
            </div>

            {createError ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {createError}
                </div>
            ) : null}
            {createSuccess ? (
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                    Admin account created. You can sign in now.
                </div>
            ) : null}

            <Button type="submit" size="lg" className="w-full py-2 cursor-pointer" disabled={createLoading || createSuccess}>
                {createLoading ? "Creating admin..." : "Create admin account"}
            </Button>
            <p className="text-xs text-muted-foreground">
                This one-time setup creates the first administrator for the system.
            </p>
        </form>
    )
}
