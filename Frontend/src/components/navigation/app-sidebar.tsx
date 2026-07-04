import type { LucideIcon } from "lucide-react"
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Landmark,
  Users,
  CalendarClock,
  FileText,
  ChartLine,
  Settings,
  ShieldCogCorner,
  BellDot,
  LogOut,
  UserCircle2,
  ClipboardCheck
} from "lucide-react"
import { Link } from "react-router-dom"
import { useNotifications } from "@/hooks/useNotifications"

import { cn } from "@/lib/utils"
import { RoleGate } from "@/components/auth/role-gate"
import { type UserRole, USER_ROLES as userRoles } from "@/types/user"


type SidebarItem = {
  label: string
  to: string
  icon: LucideIcon
  allowedRoles: UserRole[]
}

type SidebarGroup = {
  label: string
  items: SidebarItem[]
}

const sidebarGroups: SidebarGroup[] = [
  {
    label: "MAIN",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, allowedRoles: userRoles }],
  },
  {
    label: "MODULES",
    items: [
      { label: "Branch Management", to: "/branch-management", icon: Building2, allowedRoles: userRoles },
      { label: "Lessor Management", to: "/lessor-management", icon: Users, allowedRoles: userRoles },
      { label: "Lease Management", to: "/lease-management", icon: FileText, allowedRoles: userRoles },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { label: "IFRS 16 Reporting", to: "/ifrs-16-reporting", icon: ChartLine, allowedRoles: userRoles },
      { label: "Payment Schedule", to: "/payment-schedule", icon: CalendarClock, allowedRoles: userRoles },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Notifications", to: "/notifications", icon: BellDot, allowedRoles: userRoles },
      { label: "Approval Center", to: "/approval-center", icon: ClipboardCheck, allowedRoles: ["admin"] },
      { label: "Audit & History", to: "/audit-history", icon: ShieldCogCorner, allowedRoles: ["admin"] },
      { label: "User Management", to: "/user-management", icon: Users, allowedRoles: ["admin"] as UserRole[] },
      // { label: "Settings", to: "/settings", icon: Settings, allowedRoles: userRoles },
    ],
  },
  {
    label: "AUTH",
    items: [
      { label: "My Profile", to: "/profile", icon: UserCircle2, allowedRoles: userRoles },
      { label: "Logout", to: "/logout", icon: LogOut, allowedRoles: userRoles },
    ],
  },
]

type AppSidebarProps = {
  currentPath: string
  collapsed: boolean
  showCollapseToggle?: boolean
  onCollapseToggle?: () => void
  onNavigate?: () => void
}

export function AppSidebar({
  currentPath,
  collapsed,
  showCollapseToggle = false,
  onCollapseToggle,
  onNavigate,
}: AppSidebarProps) {
  const { unreadCount } = useNotifications()
  return (
    <aside
      className={cn(
        "flex h-svh flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className="border-b border-sidebar-border px-4 py-5">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
          <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Landmark className="size-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">IFRS 16 Lease Suite</p>
              <p className="truncate text-xs text-muted-foreground">
                Financial data & reports
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {sidebarGroups.map((group) => (
          <section key={group.label} className="space-y-1">
            {!collapsed && (
              <p className="px-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <RoleGate key={item.to} allowedRoles={item.allowedRoles}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center rounded-md text-sm transition-colors",
                    collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2",
                    currentPath === item.to
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                <div className="relative">
                    <item.icon className="size-4 shrink-0" />
                  {/* show small indicator for unread notifications */}
                  {item.to === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-block h-2 w-2 rounded-full bg-rose-500 ring-1 ring-white" />
                  )}
                </div>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </RoleGate>
            )
            )}
          </section>
        ))}
      </nav>

      {showCollapseToggle && onCollapseToggle && (
        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={onCollapseToggle}
            className={cn(
              "flex w-full items-center rounded-md px-2.5 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
              collapsed ? "justify-center" : "gap-2"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      )}
    </aside>
  )
}
