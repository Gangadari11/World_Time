export type ToastType = "success" | "error" | "warning" | "info"

export type ToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left"

export type ToastInput = {
  title: string
  description?: string
  type?: ToastType
  duration?: number
  position?: ToastPosition
}

export type Toast = {
  id: string
  title: string
  description?: string
  type: ToastType
  duration: number
  position: ToastPosition
  createdAt: number
}

export const DEFAULT_TOAST_DURATION = 5000
export const DEFAULT_TOAST_POSITION: ToastPosition = "top-right"
