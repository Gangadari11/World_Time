import { useNotificationContext } from "@/contexts/notification/notification-provider"

export function useNotifications() {
  return useNotificationContext()
}