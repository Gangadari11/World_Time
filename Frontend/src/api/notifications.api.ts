import { apiRequest } from "@/api/client"
import type {
  MarkAllReadResponse,
  NotificationItem,
  NotificationQuery,
  PagedResult,
} from "@/types/notification"

function toQueryString(query: NotificationQuery = {}) {
  const params = new URLSearchParams()

  if (query.pageNumber !== undefined) {
    params.set("pageNumber", String(query.pageNumber))
  }

  if (query.pageSize !== undefined) {
    params.set("pageSize", String(query.pageSize))
  }

  if (query.isRead !== undefined) {
    params.set("isRead", String(query.isRead))
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}

export async function getNotifications(query: NotificationQuery = {}) {
  return await apiRequest<PagedResult<NotificationItem>>(`/notifications${toQueryString(query)}`)
}

export async function getUnreadNotifications(query: NotificationQuery = {}) {
  return await apiRequest<PagedResult<NotificationItem>>(`/notifications/unread${toQueryString(query)}`)
}

export async function markNotificationAsRead(id: number) {
  return await apiRequest<NotificationItem>(`/notifications/${id}/read`, {
    method: "PUT",
  })
}

export async function markAllNotificationsAsRead() {
  return await apiRequest<MarkAllReadResponse>("/notifications/read-all", {
    method: "PUT",
  })
}
