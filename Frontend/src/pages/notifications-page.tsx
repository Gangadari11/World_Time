import { useMemo, useState } from "react"
import {
  BellDot,
  CalendarClock,
  CheckCheck,
  ChevronRight,
  RefreshCcw,
  Info
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import {
  parseNotificationTimestamp,
  type NotificationFilter,
} from "@/contexts/notification/notification-provider"
import { useNotifications } from "@/hooks/useNotifications"
import { useToast } from "@/hooks/useToast"
import type { NotificationItem } from "@/types/notification"

const tabs: Array<{ value: NotificationFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "expiry", label: "Expiry alerts" },
]

export function NotificationsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all")
  const {
    allNotifications,
    counts,
    unreadCount,
    loading,
    mutating,
    error,
    refresh,
    markAsRead,
    markAllRead,
    categorize,
  } = useNotifications()
  const { addToast } = useToast()
  const isAdmin = user?.role === "admin"

  const filteredNotifications = useMemo(() => {
    return allNotifications.filter((item) => {
      if (activeFilter === "all") return true
      if (activeFilter === "unread") return !item.isRead
      return categorize(item.type) === activeFilter
    })
  }, [activeFilter, allNotifications, categorize])

  async function handleMarkAllRead() {
    try {
      await markAllRead()
      addToast({
        type: "success",
        title: "Notifications updated",
        description: "All notifications were marked as read.",
      })
    } catch (err) {
      addToast({
        type: "error",
        title: "Action failed",
        description: err instanceof Error ? err.message : "Could not mark all notifications as read.",
      })
    }
  }

  async function handleMarkAsRead(item: NotificationItem) {
    if (item.isRead) return

    try {
      await markAsRead(item.id)
    } catch (err) {
      addToast({
        type: "error",
        title: "Action failed",
        description: err instanceof Error ? err.message : "Could not mark notification as read.",
      })
    }
  }

  async function handleRowSelect(item: NotificationItem) {
    await handleMarkAsRead(item)
  }

  async function handleMoreAction(item: NotificationItem) {
    await handleMarkAsRead(item)

    const actionPath = getMoreActionPath(item)
    if (actionPath) {
      navigate(actionPath)
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread alerts`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={refresh}
              disabled={loading || mutating}
            >
              <RefreshCcw className="size-4" />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || loading || mutating}
            >
              <CheckCheck className="size-4" />
              Mark all read
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            size="sm"
            variant="outline"
            type="button"
            className={cn(
              "capitalize cursor-pointer",
              activeFilter === tab.value && "border-primary bg-primary/10 text-primary"
            )}
            onClick={() => setActiveFilter(tab.value)}
          >
            {tab.label} ({counts[tab.value]})
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card/80 p-3 shadow-sm backdrop-blur">
        {loading ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No notifications found for this filter.
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotifications.map((item) => {
              const category = categorize(item.type)
              const Icon = category === "expiry" ? CalendarClock : Info

              const iconStyle =
                category === "expiry"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-sky-500/20 text-sky-400"

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => void handleRowSelect(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      void handleRowSelect(item)
                    }
                  }}
                  className={cn(
                    "flex w-full items-start gap-4 px-3 py-4 text-left transition-colors hover:bg-muted/40",
                    !item.isRead && "bg-primary/5",
                  )}
                >
                  <div className="pt-2">
                    <span
                      className={cn(
                        "block size-2 rounded-full",
                        item.isRead ? "bg-transparent" : "bg-primary",
                      )}
                    />
                  </div>

                  <div className={cn("mt-0.5 rounded-xl p-2.5 mr-2", iconStyle)}>
                    <Icon className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-2">
                      <p className="text-base font-semibold leading-tight">{item.title}</p>
                      {!item.isRead ? (
                        <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                    <p className="mt-3 text-sm text-muted-foreground">{toRelativeTime(item.createdAt)}</p>

                    {isAdmin && getMoreActionPath(item) ? (
                      <div className="mt-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={(event) => {
                            event.stopPropagation()
                            void handleMoreAction(item)
                          }}
                        >
                          More action
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BellDot className="size-4" />
        Click a notification row to mark it as read.
      </div>
    </section>
  )
}

function getMoreActionPath(item: NotificationItem) {
  if (item.referenceType !== "EntityChangeRequest" || !item.referenceId) {
    return null
  }

  const requestId = Number(item.referenceId)
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return null
  }

  return `/approval-center?requestId=${requestId}`
}

function toRelativeTime(value: string) {
  const now = Date.now()
  const created = parseNotificationTimestamp(value).getTime()

  if (Number.isNaN(created)) {
    return "Just now"
  }

  const deltaSeconds = Math.max(Math.floor((now - created) / 1000), 0)

  if (deltaSeconds < 60) {
    return "Just now"
  }

  const deltaMinutes = Math.floor(deltaSeconds / 60)
  if (deltaMinutes < 60) {
    return `${deltaMinutes} minute${deltaMinutes === 1 ? "" : "s"} ago`
  }

  const deltaHours = Math.floor(deltaMinutes / 60)
  if (deltaHours < 24) {
    return `${deltaHours} hour${deltaHours === 1 ? "" : "s"} ago`
  }

  const deltaDays = Math.floor(deltaHours / 24)
  return `${deltaDays} day${deltaDays === 1 ? "" : "s"} ago`
}
