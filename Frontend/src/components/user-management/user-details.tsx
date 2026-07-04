import { Button } from "@/components/ui/button"
import { Pencil, Shield, Check, X, Loader2, RotateCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/user.util"
import { rolePermissionMatrix } from "@/data/users"
import { type User, getUserRoleDisplayName } from "@/types/user"


type UserDetailsProps = {
    isLoading: boolean
    error: unknown
    userData: User[]
    onEdit: (user: User | null) => void
    onRetry: () => void
}

export function UserDetails({ isLoading, error, userData, onEdit, onRetry }: UserDetailsProps) {    
    return (
        <div className="space-y-5 p-1">
            <div className="overflow-hidden rounded-xl border">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="border-b bg-muted/90 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left">Name</th>
                                <th className="px-4 py-3 text-left">Email</th>
                                <th className="px-4 py-3 text-left">Role</th>
                                <th className="px-4 py-3 text-left">Registered On</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        <div className="flex items-center gap-3 justify-center">
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        <div className="flex items-center gap-2 justify-center">
                                            <span>An unexpected error occurred.
                                                <Button
                                                    size="sm"
                                                    variant="link"
                                                    className="hover:text-foreground cursor-pointer underline "
                                                    onClick={onRetry}
                                                >
                                                    Retry
                                                    <RotateCw className="size-3.5" />
                                                </Button>
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (userData.map((user) => (
                                <tr key={user.userId} className="transition-colors hover:bg-muted/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-9 items-center justify-center rounded-full border bg-muted/60 text-xs font-semibold text-muted-foreground">
                                                {getInitials(user.fullName)}
                                            </div>
                                            <span className="font-medium text-foreground">
                                                {user.fullName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {user.email}
                                    </td>
                                    <td className="px-4 py-3">{getUserRoleDisplayName(user.role)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {user.createdAt ? 
                                            new Date(user.createdAt).toLocaleDateString(undefined, { 
                                                year: "numeric", month: "short", day: "numeric",
                                        }) : "N/A"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-2 cursor-pointer"
                                            onClick={() => {
                                                onEdit({ userId: user.userId, fullName: user.fullName, email: user.email, role: user.role })
                                            }}
                                        >
                                            <Pencil className="size-3.5" />
                                            Edit
                                        </Button>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rounded-2xl pt-5">
                <div className="flex items-center gap-2 border-b pb-3">
                    <Shield className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Role Permission Matrix
                    </h3>
                </div>
                <div className="mt-4 overflow-x-auto rounded-sm">
                    <table className="min-w-full text-sm">
                        <thead className="border-b bg-muted/80 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left">Permission</th>
                                <th className="px-4 py-3 text-center">Admin</th>
                                <th className="px-4 py-3 text-center">Data Entry</th>
                                <th className="px-4 py-3 text-center">Auditor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rolePermissionMatrix.map((row, index) => (
                                <tr
                                    key={row.permission}
                                    className={cn("transition-colors", index % 2 === 0 ? "bg-muted/50" : "bg-background")}
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {row.permission}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {row.admin ? (
                                            <Check className="mx-auto size-4 text-emerald-500" />
                                        ) : (
                                            <X className="mx-auto size-4 text-destructive" />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {row.data_entry ? (
                                            <Check className="mx-auto size-4 text-emerald-500" />
                                        ) : (
                                            <X className="mx-auto size-4 text-destructive" />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {row.auditor ? (
                                            <Check className="mx-auto size-4 text-emerald-500" />
                                        ) : (
                                            <X className="mx-auto size-4 text-destructive" />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
