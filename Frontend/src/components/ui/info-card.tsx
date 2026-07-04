import type { ReactNode } from "react"

import { cn } from "@/lib/utils"


export type InfoCardItem = {
    label: string
    value: ReactNode
}

type InfoCardProps = {
    title: string
    icon: ReactNode
    items: InfoCardItem[]
    className?: string
}

export function InfoCard({ title, icon, items, className }: InfoCardProps) {
    return (
        <div className={cn("rounded-2xl border p-5", className)}>
            <div className="flex items-center gap-2 border-b pb-3">
                {icon}
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {title}
                </h3>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
                {items.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium text-foreground">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}