"use client"

import type React from "react"
import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  showCloseButton?: boolean
  footer?: React.ReactNode
}

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "m-0 h-full w-full max-w-full",
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
  footer,
}: ModalProps) {
  // ปิดด้วย Esc และล็อกการเลื่อนพื้นหลังขณะเปิด
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isFull = size === "full"

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className={cn("flex", isFull ? "h-screen w-screen" : "min-h-screen items-center justify-center p-3 sm:p-4")}
      >
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />

        <div
          className={cn(
            "relative w-full animate-fade-in bg-card shadow-overlay",
            isFull
              ? "h-full w-full"
              : `${SIZE_CLASSES[size]} flex max-h-[92vh] flex-col rounded-xl border border-border`,
          )}
        >
          {!isFull && (
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-foreground">{title}</h3>
                {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="ปิด"
                  className="-mr-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              )}
            </div>
          )}

          <div className={cn(isFull ? "h-full w-full" : "scrollbar-slim flex-1 overflow-y-auto px-5 py-4")}>
            {children}
          </div>

          {footer && !isFull && (
            <div className="shrink-0 border-t border-border px-5 py-3">{footer}</div>
          )}
        </div>
      </div>
    </div>
  )
}
