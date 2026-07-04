import { useEffect, useState, type SubmitEvent } from "react"
import { Eye, EyeOff, UserCog, UserPlus } from "lucide-react"

import { type CreateUserInput, type UserRole, USER_ROLE_OPTIONS as roleOptions } from "@/types/user"
import { Button } from "@/components/ui/button"


type UserEditProps = {
    isLoading: boolean
    isEditing: boolean
    initialFormValues: CreateUserInput
    onSubmit: (payload: CreateUserInput) => Promise<void>
    onCancel: () => void
}

export function UserEdit({ isLoading, isEditing, initialFormValues, onSubmit, onCancel }: UserEditProps) {
    const [formValues, setFormValues] = useState<CreateUserInput>(initialFormValues)
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)

    useEffect(() => {
        setFormValues(initialFormValues)
    }, [initialFormValues, isEditing])

    const isFormValid =
        formValues.fullName.trim() !== "" &&
        formValues.email.trim() !== "" &&
        (isEditing ? (
            formValues.fullName !== initialFormValues.fullName ||
            formValues.email !== initialFormValues.email ||
            formValues.role !== initialFormValues.role
        ) : true)
    
    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()

        const trimmedValues: CreateUserInput = {
            fullName: formValues.fullName.trim(),
            email: formValues.email.trim(),
            role: formValues.role,
            password: formValues.password,
        }

        await onSubmit(trimmedValues)

        if (!isEditing) {
            setFormValues(initialFormValues)
        }
    }

    return (
        <form className="space-y-5 p-1" onSubmit={handleSubmit}>
            <div className="rounded-2xl border p-5">
                <div className="flex items-center gap-2 border-b pb-3">
                    {isEditing ? (
                        <UserCog className="size-4 text-muted-foreground" />
                    ) : (
                        <UserPlus className="size-4 text-muted-foreground" />
                    )}
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {isEditing ? "Edit User" : "Register User"}
                    </h3>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label htmlFor="full-name" className="text-sm font-medium text-foreground">
                        Full Name
                        <input
                            id="full-name"
                            name="fullName"
                            value={formValues.fullName}
                            onChange={(event) => setFormValues((prev) => ({ ...prev, fullName: event.target.value }))}
                            placeholder="Enter full name"
                            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
                        />
                    </label>
                    
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email Address
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formValues.email}
                            onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
                            placeholder="name@softlogic.com"
                            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
                        />
                    </label>
                    
                    <label htmlFor="role" className="text-sm font-medium text-foreground">
                        Role
                        <select
                            id="role"
                            name="role"
                            value={formValues.role}
                            onChange={(event) => setFormValues((prev) => ({ ...prev, role: event.target.value as UserRole }))}
                            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
                        >
                            {roleOptions.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.displayName}
                                </option>
                            ))}
                        </select>
                    </label>
                    
                    {!isEditing && (
                        <label htmlFor="initial-password" className="text-sm font-medium text-foreground">
                            Initial Password
                            <div className="relative mt-2">
                                <input
                                    id="initial-password"
                                    name="password"
                                    type={isPasswordVisible ? "text" : "password"}
                                    value={formValues.password}
                                    onChange={(event) => setFormValues((prev) => ({ ...prev, password: event.target.value }))}
                                    className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                                >
                                    {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </label>
                    )}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button
                        className="px-4 cursor-pointer"
                        type="submit"
                        disabled={isLoading || !isFormValid}
                    >
                        {isLoading ? "Saving..." : isEditing ? "Update User" : "Register User"}
                    </Button>
                    <Button
                        variant="outline"
                        className="px-4 cursor-pointer"
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </form>
    )
}