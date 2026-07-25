"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  FileText,
  History,
  Home,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

interface SidebarProps {
  onOpenProfileModal: () => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

const navigation = [
  { name: "แดชบอร์ด", href: "/dashboard", icon: Home },
  { name: "คอนโด", href: "/condos", icon: Building2 },
  { name: "ผู้เช่า", href: "/tenants", icon: Users },
  { name: "ประวัติผู้เช่า", href: "/tenant-history", icon: History },
  { name: "จัดการค่าเช่า", href: "/rent", icon: CreditCard },
  { name: "การเงิน (คอนโด)", href: "/financials", icon: TrendingUp },
  { name: "การเงินส่วนตัว", href: "/personal-finance", icon: Wallet },
  { name: "รายงาน", href: "/reports", icon: FileText },
  { name: "การแจ้งเตือน", href: "/notifications", icon: Bell },
]

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"
  const Icon = !mounted ? Moon : isDark ? Sun : Moon
  const label = !mounted ? "สลับธีม" : isDark ? "โหมดสว่าง" : "โหมดมืด"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={cn(
        "flex w-full items-center rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        collapsed && "md:justify-center",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", !collapsed && "mr-2")} />
      {!collapsed && <span className="whitespace-nowrap text-xs">{label}</span>}
    </button>
  )
}

export function Sidebar({ onOpenProfileModal, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebarCollapsed") === "true"
    }
    return false
  })

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed.toString())
  }, [isCollapsed])

  useEffect(() => {
    if (isMobileOpen && onMobileClose) {
      onMobileClose()
    }
  }, [pathname])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      setIsLoggingOut(false)
    }
  }

  // บนมือถือเมนูกางเต็มเสมอ สถานะยุบใช้เฉพาะเดสก์ท็อป
  const collapsed = isCollapsed && !isMobileOpen
  const CollapseIcon = isCollapsed ? ChevronsRight : ChevronsLeft

  const sidebarContent = (
    <div className="relative flex h-full w-72 flex-col border-r border-border bg-card transition-all duration-300 md:w-auto">
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "ขยายเมนู" : "ยุบเมนู"}
        className="absolute -right-3 top-7 z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-surface-raised text-muted-foreground shadow-raised transition-colors hover:border-primary hover:text-primary md:flex"
      >
        <CollapseIcon className="h-3.5 w-3.5" />
      </button>

      {isMobileOpen && (
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="ปิดเมนู"
          className="absolute right-3 top-4 z-20 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <div className="flex h-16 items-center border-b border-border px-4">
        <div className={cn("flex items-center gap-3", collapsed && "md:w-full md:justify-center md:gap-0")}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">CondoManager</p>
              <p className="truncate text-[11px] text-muted-foreground">ระบบจัดการคอนโด</p>
            </div>
          )}
        </div>
      </div>

      <nav className="scrollbar-slim min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2.5 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onMobileClose}
              title={collapsed ? item.name : undefined}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                collapsed && "md:justify-center",
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", !collapsed && "mr-3")} />
              {!collapsed && <span className="truncate whitespace-nowrap">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto shrink-0 space-y-1 border-t border-border p-2.5">
        <button
          type="button"
          onClick={() => {
            onOpenProfileModal()
            onMobileClose?.()
          }}
          title="ตั้งค่าโปรไฟล์"
          className={cn(
            "group flex w-full items-center rounded-lg p-2 transition-colors hover:bg-accent",
            collapsed && "md:justify-center",
          )}
        >
          <span className="relative shrink-0">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-sm font-medium text-primary">
              {user?.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profile_picture_url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                user?.full_name?.charAt(0) || "U"
              )}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />
          </span>

          {!collapsed && (
            <>
              <span className="ml-2.5 min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-medium leading-tight text-foreground">
                  {user?.full_name}
                </span>
                <span className="block truncate text-xs leading-tight text-muted-foreground">{user?.email}</span>
              </span>
              <Settings className="ml-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:rotate-90" />
            </>
          )}
        </button>

        <ThemeToggle collapsed={collapsed} />

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors",
            isLoggingOut
              ? "cursor-not-allowed text-muted-foreground"
              : "text-muted-foreground hover:bg-destructive-muted hover:text-destructive",
            collapsed && "md:justify-center",
          )}
        >
          {isLoggingOut ? (
            <Loader2 className={cn("h-4 w-4 shrink-0 animate-spin", !collapsed && "mr-2")} />
          ) : (
            <LogOut className={cn("h-4 w-4 shrink-0", !collapsed && "mr-2")} />
          )}
          {!collapsed && (
            <span className="whitespace-nowrap text-xs">{isLoggingOut ? "กำลังออก..." : "ออกจากระบบ"}</span>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className={cn("hidden h-full transition-all duration-300 md:flex", isCollapsed ? "w-20" : "w-64")}>
        {sidebarContent}
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="absolute left-0 top-0 h-full w-72 animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}

export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-[18px] w-[18px]" />
        </span>
        <span className="text-base font-semibold tracking-tight text-foreground">CondoManager</span>
      </div>
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="เปิดเมนู"
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>
    </div>
  )
}
