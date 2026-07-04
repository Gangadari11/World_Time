import * as signalR from "@microsoft/signalr"
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

import {
  getNotifications,
  getUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/api/notifications.api"
import type { NotificationItem } from "@/types/notification"

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5127/api"
const notificationsHubUrl = `${apiBaseUrl.replace(/\/api\/?$/, "")}/hubs/notifications`

export type NotificationFilter = "all" | "unread" | "expiry"

type NotificationSnapshot = {
  allNotifications: NotificationItem[]
  unreadCount: number
  loading: boolean
  mutating: boolean
  error: string | null
}

type NotificationPayload = NotificationItem | { notification?: NotificationItem }

type NotificationsContextValue = NotificationSnapshot & {
  counts: { all: number; unread: number; expiry: number }
  refresh: () => Promise<void>
  markAsRead: (id: number) => Promise<NotificationItem>
  markAllRead: () => Promise<unknown>
  categorize: (type: string) => Exclude<NotificationFilter, "all" | "unread"> | "other"
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

const initialSnapshot: NotificationSnapshot = {
  allNotifications: [],
  unreadCount: 0,
  loading: false,
  mutating: false,
  error: null,
}

let snapshot = initialSnapshot
const subscribers = new Set<() => void>()
let connection: signalR.HubConnection | null = null
let connectionStartPromise: Promise<void> | null = null
let hydrationPromise: Promise<void> | null = null

function notifySubscribers() {
  for (const subscriber of subscribers) {
    subscriber()
  }
}

function publishSnapshot(updater: (current: NotificationSnapshot) => NotificationSnapshot) {
  snapshot = updater(snapshot)
  notifySubscribers()
}

function isNotificationItem(value: unknown): value is NotificationItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as NotificationItem).id === "number"
  )
}

function extractNotification(payload: NotificationPayload): NotificationItem | null {
  if (isNotificationItem(payload)) {
    return payload
  }

  if (payload.notification && isNotificationItem(payload.notification)) {
    return payload.notification
  }

  return null
}

function sortNotifications(items: NotificationItem[]) {
  return [...items].sort(
    (a, b) =>
      parseNotificationTimestamp(b.createdAt).getTime() -
      parseNotificationTimestamp(a.createdAt).getTime(),
  )
}

function mergeNotification(current: NotificationSnapshot, nextNotification: NotificationItem) {
  const nextItems = current.allNotifications.filter((item) => item.id !== nextNotification.id)
  const unreadCount = nextNotification.isRead
    ? current.unreadCount
    : current.allNotifications.some((item) => item.id === nextNotification.id && !item.isRead)
      ? current.unreadCount
      : current.unreadCount + 1

  return {
    ...current,
    allNotifications: sortNotifications([nextNotification, ...nextItems]).slice(0, 200),
    unreadCount,
  }
}

export function parseNotificationTimestamp(value: string) {
  const hasTimezoneDesignator = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)
  return new Date(hasTimezoneDesignator ? value : `${value}Z`)
}

function categorize(type: string): Exclude<NotificationFilter, "all" | "unread"> | "other" {
  const normalized = type.toLowerCase().replaceAll("_", "").replaceAll(" ", "")

  if (normalized.includes("expiry") || normalized.includes("renewal")) {
    return "expiry"
  }

  return "other"
}

async function ensureConnection() {
  if (connectionStartPromise) {
    return connectionStartPromise
  }

  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(notificationsHubUrl, {
        accessTokenFactory: () => localStorage.getItem("accessToken") ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build()

    connection.on("ReceiveNotification", (payload: NotificationPayload) => {
      const notification = extractNotification(payload)
      if (!notification) {
        return
      }

      publishSnapshot((current) => mergeNotification(current, notification))
    })

    connection.on("NotificationRead", (payload: NotificationPayload) => {
      const notification = extractNotification(payload)
      if (!notification) {
        return
      }

      publishSnapshot((current) => ({
        ...current,
        allNotifications: current.allNotifications.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
        unreadCount: Math.max(current.unreadCount - 1, 0),
      }))
    })
  }

  if (connection.state === signalR.HubConnectionState.Connected) {
    return Promise.resolve()
  }

  connectionStartPromise = connection.start()
    .catch((error) => {
      publishSnapshot((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Failed to connect to notifications.",
      }))
      throw error
    })
    .finally(() => {
      connectionStartPromise = null
    })

  return connectionStartPromise
}

async function ensureHydrated() {
  if (hydrationPromise) {
    return hydrationPromise
  }

  hydrationPromise = (async () => {
    publishSnapshot((current) => ({ ...current, loading: true, error: null }))

    try {
      const [all, unread] = await Promise.all([
        getNotifications({ pageNumber: 1, pageSize: 100 }),
        getUnreadNotifications({ pageNumber: 1, pageSize: 100 }),
      ])

      publishSnapshot((current) => ({
        ...current,
        allNotifications: sortNotifications(all.items),
        unreadCount: unread.totalCount,
      }))
    } catch (error) {
      publishSnapshot((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Failed to load notifications",
      }))
    } finally {
      publishSnapshot((current) => ({ ...current, loading: false }))
      hydrationPromise = null
    }
  })()

  return hydrationPromise
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NotificationSnapshot>(snapshot)

  useEffect(() => {
    const subscriber = () => {
      setState(snapshot)
    }

    subscribers.add(subscriber)
    setState(snapshot)

    void ensureConnection()
    void ensureHydrated()

    return () => {
      subscribers.delete(subscriber)
    }
  }, [])

  const refresh = useCallback(async () => {
    await ensureHydrated()
  }, [])

  const markAsRead = useCallback(async (id: number) => {
    publishSnapshot((current) => ({ ...current, mutating: true }))

    try {
      const updated = await markNotificationAsRead(id)

      publishSnapshot((current) => ({
        ...current,
        allNotifications: current.allNotifications.map((item) =>
          item.id === id ? updated : item,
        ),
        unreadCount: Math.max(current.unreadCount - 1, 0),
      }))

      return updated
    } finally {
      publishSnapshot((current) => ({ ...current, mutating: false }))
    }
  }, [])

  const markAllRead = useCallback(async () => {
    publishSnapshot((current) => ({ ...current, mutating: true }))

    try {
      const result = await markAllNotificationsAsRead()
      publishSnapshot((current) => ({
        ...current,
        allNotifications: current.allNotifications.map((item) => ({ ...item, isRead: true })),
        unreadCount: 0,
      }))
      return result
    } finally {
      publishSnapshot((current) => ({ ...current, mutating: false }))
    }
  }, [])

  const counts = useMemo(() => {
    let expiry = 0

    for (const item of state.allNotifications) {
      if (categorize(item.type) === "expiry") {
        expiry += 1
      }
    }

    return {
      all: state.allNotifications.length,
      unread: state.unreadCount,
      expiry,
    }
  }, [state.allNotifications, state.unreadCount])

  const value = useMemo<NotificationsContextValue>(
    () => ({
      ...state,
      counts,
      refresh,
      markAsRead,
      markAllRead,
      categorize,
    }),
    [counts, markAllRead, markAsRead, refresh, state],
  )

  return createElement(NotificationsContext.Provider, { value }, children)
}

export function useNotificationContext() {
  const context = useContext(NotificationsContext)

  if (!context) {
    throw new Error(
      "useNotificationContext must be used within NotificationsProvider"
    )
  }

  return context
}