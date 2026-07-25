import type React from "react"
import { cn } from "@/lib/utils"

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
}

/** พื้นผิวมาตรฐานของระบบ ใช้แทน div.bg-gray-800.border.border-gray-700 ที่กระจายอยู่ทุกหน้า */
export function Panel({ className, inset = true, children, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-card",
        inset && "p-4 sm:p-5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface PanelHeaderProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  actions?: React.ReactNode
  className?: string
}

export function PanelHeader({ title, description, icon: Icon, actions, className }: PanelHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon && (
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground sm:text-base">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
