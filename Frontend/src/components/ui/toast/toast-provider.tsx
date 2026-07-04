import * as React from "react"

import {
  DEFAULT_TOAST_DURATION,
  DEFAULT_TOAST_POSITION,
  type Toast,
  type ToastInput,
  type ToastPosition,
} from "./toast-types"
import { ToastViewport } from "./toast-viewport"

type ToastContextValue = {
  addToast: (input: ToastInput) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

const POSITIONS: ToastPosition[] = [
  "top-right",
  "top-left",
  "bottom-right",
  "bottom-left",
]

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const timersRef = React.useRef(new Map<string, number>())

  const removeToast = React.useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }

    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const clearToasts = React.useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current.clear()
    setToasts([])
  }, [])

  const addToast = React.useCallback(
    (input: ToastInput) => {
      const id = createToastId()
      const toast: Toast = {
        id,
        title: input.title,
        description: input.description,
        type: input.type ?? "info",
        duration: input.duration ?? DEFAULT_TOAST_DURATION,
        position: input.position ?? DEFAULT_TOAST_POSITION,
        createdAt: Date.now(),
      }

      setToasts((current) => [...current, toast])

      const timer = window.setTimeout(() => {
        removeToast(id)
      }, toast.duration)

      timersRef.current.set(id, timer)

      return id
    },
    [removeToast]
  )

  React.useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [])

  const value = React.useMemo<ToastContextValue>(() => {
    return { addToast, removeToast, clearToasts }
  }, [addToast, removeToast, clearToasts])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {POSITIONS.map((position) => (
        <ToastViewport
          key={position}
          position={position}
          toasts={toasts.filter((toast) => toast.position === position)}
          onDismiss={removeToast}
        />
      ))}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }

  return context
}
