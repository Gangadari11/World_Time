import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Toast, ToastType } from "./toast-types"

type ToastItemProps = {
  toast: Toast
  onDismiss: (id: string) => void
}

type ToastStyle = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  iconClassName: string
  barClassName: string
}

const TOAST_STYLES: Record<ToastType, ToastStyle> = {
  success: {
    icon: CheckCircle2,
    iconClassName: "text-emerald-500",
    barClassName: "bg-emerald-500",
  },
  error: {
    icon: XCircle,
    iconClassName: "text-rose-500",
    barClassName: "bg-rose-500",
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: "text-amber-500",
    barClassName: "bg-amber-500",
  },
  info: {
    icon: Info,
    iconClassName: "text-sky-500",
    barClassName: "bg-sky-500",
  },
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { icon: Icon, iconClassName, barClassName } = TOAST_STYLES[toast.type]

  return (
    <div
      className={cn(
        "toast-item group pointer-events-auto relative w-100 max-w-[calc(100vw-3rem)] overflow-hidden rounded-sm border border-border bg-card text-foreground shadow-lg",
        "animate-in fade-in zoom-in-95"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex gap-3 p-4">
        <div className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-muted/30">
          <Icon className={cn("size-4", iconClassName)} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {toast.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Dismiss notification"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent">
        <div
          className={cn("toast-progress h-full origin-left", barClassName)}
          style={
            {
              "--toast-duration": `${toast.duration}ms`,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  )
}
