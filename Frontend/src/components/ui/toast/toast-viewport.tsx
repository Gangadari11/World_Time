import { cn } from "@/lib/utils"
import type { Toast, ToastPosition } from "./toast-types"
import { ToastItem } from "./toast-item"

type ToastViewportProps = {
  position: ToastPosition
  toasts: Toast[]
  onDismiss: (id: string) => void
}

const POSITION_STYLES: Record<ToastPosition, string> = {
  "top-right": "right-6 top-6 items-end",
  "top-left": "left-6 top-6 items-start",
  "bottom-right": "right-6 bottom-6 items-end",
  "bottom-left": "left-6 bottom-6 items-start",
}

export function ToastViewport({ position, toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) {
    return null
  }

  const stackDirection = position.startsWith("bottom")
    ? "flex-col-reverse"
    : "flex-col"

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-50 flex gap-3",
        stackDirection,
        POSITION_STYLES[position]
      )}
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
