import { CalendarClock, Mail, Pencil, ShieldCheck, UserCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { type UserRole, getUserRoleDisplayName } from "@/types/user"

type ProfileDetailsProps = {
    profile: {
        fullName: string
        email: string
        role: UserRole
        registeredAt: string
    }
    onEditProfile: () => void
}

export function ProfileDetails({ profile, onEditProfile }: ProfileDetailsProps) {
    return (
        <div className="space-y-6 p-1">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <article className="rounded-2xl border bg-card p-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex size-24 items-center justify-center rounded-full border bg-muted/60 text-muted-foreground">
                            <UserCircle2 className="size-12" />
                        </div>
                        <h2 className="mt-4 text-lg font-semibold text-foreground">{profile.fullName}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
                        <p className="mt-3 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {getUserRoleDisplayName(profile.role)}
                        </p>
                        <p className="mt-4 text-xs text-muted-foreground">
                            Profile photo uploads are not supported yet.
                        </p>
                    </div>
                </article>

                <article className="rounded-2xl border bg-card p-6">
                    <div className="flex items-center justify-between gap-3 border-b pb-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Account Information
                        </h3>
                        <Button
                            size="sm"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={onEditProfile}
                        >
                            <Pencil className="size-3.5" />
                            Edit
                        </Button>
                    </div>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border bg-muted/30 p-4">
                            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <UserCircle2 className="size-3.5" />
                                Full Name
                            </dt>
                            <dd className="mt-2 text-sm font-medium text-foreground">{profile.fullName}</dd>
                        </div>

                        <div className="rounded-xl border bg-muted/30 p-4">
                            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <Mail className="size-3.5" />
                                Email
                            </dt>
                            <dd className="mt-2 text-sm font-medium text-foreground">{profile.email}</dd>
                        </div>

                        <div className="rounded-xl border bg-muted/30 p-4">
                            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <ShieldCheck className="size-3.5" />
                                Role
                            </dt>
                            <dd className="mt-2 text-sm font-medium text-foreground">{getUserRoleDisplayName(profile.role)}</dd>
                        </div>

                        <div className="rounded-xl border bg-muted/30 p-4">
                            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <CalendarClock className="size-3.5" />
                                Registered Date
                            </dt>
                            <dd className="mt-2 text-sm font-medium text-foreground">
                                {new Date(profile.registeredAt).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </dd>
                        </div>
                    </dl>
                </article>
            </div>
        </div>
    )
}