import { useMemo, useState, type SubmitEvent } from "react"
import { Eye, EyeOff, KeyRound, Mail, Save, UserPen } from "lucide-react"

import { Button } from "@/components/ui/button"

export type ProfileUpdateInput = {
    fullName: string
    email: string
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

type ProfileUpdateProps = {
    profile: {
        fullName: string
        email: string
    }
    isSaving: boolean
    onSubmit: (payload: ProfileUpdateInput) => Promise<void>
    onCancel: () => void
}

const emptyPasswordState = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
}

export function ProfileUpdate({ profile, isSaving, onSubmit, onCancel }: ProfileUpdateProps) {
    const [fullName, setFullName] = useState(profile.fullName)
    const [email, setEmail] = useState(profile.email)
    const [passwordValues, setPasswordValues] = useState(emptyPasswordState)
    const [showPasswords, setShowPasswords] = useState(false)

    const isPasswordUpdateRequested =
        passwordValues.currentPassword !== "" ||
        passwordValues.newPassword !== "" ||
        passwordValues.confirmPassword !== ""

    const isPasswordSectionValid = !isPasswordUpdateRequested || (
        passwordValues.currentPassword.trim() !== "" &&
        passwordValues.newPassword.trim().length >= 8 &&
        passwordValues.confirmPassword.trim() !== "" &&
        passwordValues.newPassword === passwordValues.confirmPassword
    )

    const hasProfileChanges =
        fullName.trim() !== profile.fullName ||
        email.trim() !== profile.email

    const isFormValid =
        fullName.trim() !== "" &&
        email.trim() !== "" &&
        isPasswordSectionValid &&
        (hasProfileChanges || isPasswordUpdateRequested)

    const passwordHelperText = useMemo(() => {
        if (!isPasswordUpdateRequested) {
            return "Leave password fields empty if you do not want to change your password."
        }

        if (passwordValues.newPassword.trim().length > 0 && passwordValues.newPassword.trim().length < 8) {
            return "New password must be at least 8 characters long."
        }

        if (
            passwordValues.confirmPassword.trim() !== "" &&
            passwordValues.newPassword !== passwordValues.confirmPassword
        ) {
            return "New password and confirmation must match."
        }

        return "Password update details look good."
    }, [isPasswordUpdateRequested, passwordValues])

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()

        const payload: ProfileUpdateInput = {
            fullName: fullName.trim(),
            email: email.trim(),
            currentPassword: passwordValues.currentPassword,
            newPassword: passwordValues.newPassword,
            confirmPassword: passwordValues.confirmPassword,
        }

        await onSubmit(payload)
        setPasswordValues(emptyPasswordState)
    }

    return (
        <form className="space-y-5 p-1" onSubmit={handleSubmit}>
            <div className="rounded-2xl border bg-card p-5">
                <div className="flex items-center gap-2 border-b pb-3">
                    <UserPen className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Update Profile
                    </h3>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label htmlFor="profile-full-name" className="text-sm font-medium text-foreground">
                        Full Name
                        <input
                            id="profile-full-name"
                            name="fullName"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder="Enter full name"
                            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
                        />
                    </label>

                    <label htmlFor="profile-email" className="text-sm font-medium text-foreground">
                        Email Address
                        <div className="relative mt-2">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                id="profile-email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="name@softlogic.com"
                                className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
                            />
                        </div>
                    </label>
                </div>

                <div className="mt-6 rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <KeyRound className="size-4 text-muted-foreground" />
                                Change Password
                            </h4>
                            <p className="mt-1 text-xs text-muted-foreground">{passwordHelperText}</p>
                        </div>
                        <button
                            type="button"
                            className="cursor-pointer rounded-md border p-2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPasswords((visible) => !visible)}
                            aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                        >
                            {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <label htmlFor="current-password" className="text-sm font-medium text-foreground">
                            Current Password
                            <input
                                id="current-password"
                                name="currentPassword"
                                type={showPasswords ? "text" : "password"}
                                value={passwordValues.currentPassword}
                                onChange={(event) => setPasswordValues((prev) => ({ ...prev, currentPassword: event.target.value }))}
                                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
                            />
                        </label>

                        <label htmlFor="new-password" className="text-sm font-medium text-foreground">
                            New Password
                            <input
                                id="new-password"
                                name="newPassword"
                                type={showPasswords ? "text" : "password"}
                                value={passwordValues.newPassword}
                                onChange={(event) => setPasswordValues((prev) => ({ ...prev, newPassword: event.target.value }))}
                                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
                            />
                        </label>

                        <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                            Confirm Password
                            <input
                                id="confirm-password"
                                name="confirmPassword"
                                type={showPasswords ? "text" : "password"}
                                value={passwordValues.confirmPassword}
                                onChange={(event) => setPasswordValues((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
                            />
                        </label>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button
                        type="submit"
                        className="cursor-pointer px-4"
                        disabled={isSaving || !isFormValid}
                    >
                        <Save className="size-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer px-4"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </form>
    )
}