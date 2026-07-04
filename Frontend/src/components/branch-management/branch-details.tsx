import { useState } from "react"
import { AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react"

import type { Branch, BranchLease } from "@/types/branch"
import { InfoCard } from "@/components/ui/info-card"
import { HorizontalTabs } from "@/components/ui/horizontal-tabs"
import { cn } from "@/lib/utils"


type BranchDetailsProps = {
    selectedBranch: Branch | null
    error: unknown
    isLoading: boolean
}

export function BranchDetails({ selectedBranch, error, isLoading }: BranchDetailsProps) {
    const [activeTab, setActiveTab] = useState<"active" | "terminated">("active")

    return (
        <div className="space-y-5 p-1">
            {error ? (
                <div className="rounded-xl border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
                    An unexpected error occurred while fetching branch details. Please try again later.
                </div>
            ) : isLoading ? (
                <div className="rounded-xl border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-3 justify-center">
                        <Loader2 className="size-4 animate-spin" />
                        <span>Loading branch details...</span>
                    </div>
                </div>
            ) : !selectedBranch ? (
                <div className="rounded-xl border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
                    Select a branch from the list to view details.
                </div>
            ) : (
                <>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <InfoCard
                            title="Branch Information"
                            icon={<Info className="size-4 text-muted-foreground" />}
                            items={[
                                { label: "Oracle Code", value: selectedBranch.oracleCode },
                                { label: "Branch Code", value: selectedBranch.branchCode },
                                { label: "Branch Name", value: selectedBranch.branchName },
                                { label: "Lessee", value: selectedBranch.lessee },
                                { label: "Status", value: selectedBranch.status },
                                { label: "Active Leases", value: String(selectedBranch.leases?.filter((lease) => lease.status === "Active").length) },
                            ]}
                        />

                        <div className="rounded-xl border p-5 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    "mt-0.5 inline-flex size-10 items-center justify-center rounded-full",
                                    selectedBranch.hasPendingChangeRequest
                                        ? "bg-amber-500/10 text-amber-600"
                                        : "bg-emerald-500/10 text-emerald-600"
                                )}>
                                    {selectedBranch.hasPendingChangeRequest ? (
                                        <AlertTriangle className="size-5" />
                                    ) : (
                                        <CheckCircle2 className="size-5" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">Approval Status</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {selectedBranch.hasPendingChangeRequest
                                            ? "This branch has a pending change request waiting for review."
                                            : "No pending change request for this branch."}
                                    </p>
                                    <div className={cn(
                                        "mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                                        selectedBranch.hasPendingChangeRequest
                                            ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                                    )}>
                                        {selectedBranch.hasPendingChangeRequest ? "Pending review" : "Up to date"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <HorizontalTabs
                        tabs={[
                            { value: "active", label: "Active Leases" },
                            { value: "terminated", label: "Terminated Leases" },
                        ]}
                        value={activeTab}
                        onChange={(value) => { setActiveTab(value as "active" | "terminated")}}
                    />

                    <LeaseTable
                        leases={selectedBranch.leases ? selectedBranch.leases.filter(
                            (lease) => lease.status === (activeTab === "active" ? "Active" : "Terminate")
                        ) : []}
                    />
                </>
            )}
        </div>
    )
}


function LeaseTable({ leases }: { leases: BranchLease[] }) {
    return (
        <div className="overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="border-b bg-muted/90 text-xs uppercase text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 text-left">Lease No</th>
                            <th className="px-4 py-3 text-left">Lessor</th>
                            <th className="px-4 py-3 text-left">Start Date</th>
                            <th className="px-4 py-3 text-left">End Date</th>
                            <th className="px-4 py-3 text-left">Address</th>
                            <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {leases.length > 0 ? (
                            leases.map((lease) => (
                                <tr
                                    key={lease.leaseNo}
                                    className="transition-colors hover:bg-muted/50"
                                >
                                    <td className="px-4 py-3 font-medium">{lease.leaseNo}</td>
                                    <td className="px-4 py-3">{lease.lessor}</td>
                                    <td className="px-4 py-3">{lease.startDate}</td>
                                    <td className="px-4 py-3">{lease.endDate}</td>
                                    <td className="px-4 py-3">{lease.leasePropertyAddress}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground",
                                            lease.status === "Active"
                                                ? "border-primary/30 bg-primary/10 text-primary"
                                                : "border-muted-foreground/20 bg-muted text-muted-foreground"
                                        )}>
                                            {lease.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-4 py-3 text-center text-muted-foreground">No leases found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
