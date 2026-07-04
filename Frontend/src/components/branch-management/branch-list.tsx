import { useState, useMemo } from "react"
import { Loader2, Search, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Branch } from "@/types/branch"
import { RoleGate } from "@/components/auth/role-gate"


type BranchListProps = {
    isLoading: boolean
    error: unknown
    branchData: Branch[]
    onViewClick: (branchId: number) => void
    onEditClick: (branchId: number) => void
    onRetry: () => void
}

export function BranchList({ isLoading, error, branchData, onViewClick, onEditClick, onRetry }: BranchListProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")

    const filteredBranches = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase()

        return branchData.filter((branch) => {
            const matchesStatus = filterStatus === "all" || branch.status.toLowerCase() === filterStatus

            if (!normalizedQuery) {
                return matchesStatus
            }

            const matchesQuery =
                branch.branchName.toLowerCase().includes(normalizedQuery) ||
                branch.oracleCode.toLowerCase().includes(normalizedQuery) ||
                branch.lessee.toLowerCase().includes(normalizedQuery)

            return matchesStatus && matchesQuery
        })
    }, [filterStatus, searchQuery, branchData])

    const filterCounts = useMemo(() => {
        const activeCount = branchData.filter((branch) => branch.status === "Active").length
        const inactiveCount = branchData.filter((branch) => branch.status === "Inactive").length

        return { all: branchData.length, active: activeCount, inactive: inactiveCount }
    }, [branchData])

    return (
        <div className="space-y-4 p-1">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex w-full flex-1 items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm shadow-xs">
                    <Search className="size-4 text-muted-foreground" />
                    <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search by branch, oracle code, or lessee"
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {["all", "active", "inactive"].map((status) => (
                        <Button
                            key={status}
                            size="sm"
                            variant="outline"
                            className={cn(
                                "capitalize cursor-pointer",
                                filterStatus === status && "border-primary/40 bg-primary/10 text-primary"
                            )}
                            onClick={() => setFilterStatus(status as "all" | "active" | "inactive")}
                        >
                            {status} ({filterCounts[status as "all" | "active" | "inactive"]})
                        </Button>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="border-b bg-muted/90 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left">Oracle Code</th>
                                <th className="px-4 py-3 text-left">Branch Name</th>
                                <th className="px-4 py-3 text-left">Lessee</th>
                                <th className="px-4 py-3 text-left">Status</th>
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
                            ) : filteredBranches.length > 0 ? (
                                filteredBranches.map((branch) => (
                                    <tr
                                        key={branch.branchId}
                                        className="transition-colors hover:bg-muted/50"
                                    >
                                        <td className="px-4 py-3 font-medium">{branch.oracleCode}</td>
                                        <td className="px-4 py-3">{branch.branchName}</td>
                                        <td className="px-4 py-3">{branch.lessee}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={cn(
                                                    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                                                    branch.status === "Active"
                                                        ? "border-primary/30 bg-primary/10 text-primary"
                                                        : "border-muted-foreground/20 bg-muted text-muted-foreground"
                                                )}
                                            >
                                                {branch.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="cursor-pointer"
                                                onClick={() => onViewClick(branch.branchId)}
                                            >
                                                View
                                            </Button>
                                            <RoleGate allowedRoles={["admin", "data_entry"]}>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="ml-2 cursor-pointer"
                                                    onClick={() => onEditClick(branch.branchId)}
                                                >
                                                    Edit
                                                </Button>
                                            </RoleGate>
                                        </td>
                                    </tr>
                                )
                                )) : (
                                <tr>
                                    <td
                                        className="px-4 py-8 text-center text-muted-foreground"
                                        colSpan={5}
                                    >
                                        No branches found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}