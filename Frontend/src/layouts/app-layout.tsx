import { Menu, Moon, Sun, X, Bell, UserCircle } from "lucide-react"
import { useState } from "react"
import { useLocation, Outlet, useNavigate } from "react-router-dom"

import { AppSidebar } from "@/components/navigation/app-sidebar"
import { NotificationsProvider } from "@/contexts/notification/notification-provider"
import {  useNotifications } from "@/hooks/useNotifications"
import { useTheme } from "@/contexts/theme/theme-provider"
import { Button } from "@/components/ui/button"

function HeaderNotificationButton() {
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  return (
    <Button variant="outline" size="icon-sm" onClick={() => navigate('/notifications')} aria-label="Notifications" className="cursor-pointer p-4">
      <div className="relative">
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-xs font-medium text-white">{unreadCount}</span>
        )}
      </div>
    </Button>
  )
}

export function AppLayout() {
  const location = useLocation()
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <NotificationsProvider>
      <div className="flex h-svh overflow-hidden bg-background text-foreground">
        <div className="sticky top-0 hidden h-svh md:block">
          <AppSidebar
            currentPath={location.pathname}
            collapsed={desktopSidebarCollapsed}
            showCollapseToggle
            onCollapseToggle={() => setDesktopSidebarCollapsed((prev) => !prev)}
          />
        </div>

        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <button
              type="button"
              className="flex-1 bg-black/40"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close sidebar"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute top-3 right-3 z-10 rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                aria-label="Close sidebar"
              >
                <X className="size-4" />
              </button>
              <AppSidebar
                currentPath={location.pathname}
                collapsed={false}
                onNavigate={() => setMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-y-scroll">
          <header className="sticky top-0 z-20 flex h-14 min-h-14 shrink-0 items-center border-b bg-background/90 px-4 backdrop-blur">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="size-4" />
            </Button>
            <div className="ml-auto flex items-center gap-2">
              {/* notification button in header */}
              <HeaderNotificationButton />
              <Button
                variant="outline"
                size="icon-sm"
                onClick={toggleTheme}
                aria-label={ theme === "dark" ? "Switch to light theme" : "Switch to dark theme" }
                className="cursor-pointer p-4"
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <Button 
                variant="outline"
                size="icon-sm" 
                className="cursor-pointer p-4 rounded-full" 
                aria-label="Profile menu"
                onClick={() => navigate('/profile')}
              >
                <UserCircle className="size-4" />
              </Button>
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </NotificationsProvider>
  )
}
