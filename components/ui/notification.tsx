"use client"

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

type NotificationType = "success" | "error" | "info"

interface NotificationProps {
  message: string
  type: NotificationType
  onClose: () => void
  duration?: number
}

const config: Record<NotificationType, { icon: typeof CheckCircle2; accent: string; tint: string }> = {
  success: { icon: CheckCircle2, accent: "text-success", tint: "bg-success-muted" },
  error: { icon: AlertCircle, accent: "text-destructive", tint: "bg-destructive-muted" },
  info: { icon: Info, accent: "text-info", tint: "bg-info-muted" },
}

export function Notification({ message, type, onClose, duration = 3000 }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const enterTimer = setTimeout(() => setIsVisible(true), 10)
    const exitTimer = setTimeout(() => setIsRemoving(true), duration)
    const removeTimer = setTimeout(onClose, duration + 300)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitTimer)
      clearTimeout(removeTimer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsRemoving(true)
    setTimeout(onClose, 300)
  }

  if (!mounted) return null

  const { icon: Icon, accent, tint } = config[type] ?? config.info

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-5 right-5 z-[100] flex items-center gap-3 rounded-xl border border-border bg-popover/95 px-4 py-3 shadow-overlay backdrop-blur-md transition-all duration-300 ease-out",
        isRemoving || !isVisible ? "translate-y-3 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100",
      )}
    >
      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", tint, accent)}>
        <Icon className="h-4 w-4" />
      </span>

      <span className="pr-1 text-sm text-foreground">{message}</span>

      <button
        type="button"
        onClick={handleClose}
        aria-label="ปิดการแจ้งเตือน"
        className="-mr-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>,
    document.body,
  )
}
