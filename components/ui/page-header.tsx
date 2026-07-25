import type React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  actions?: React.ReactNode
  className?: string
}

/** หัวเรื่องของหน้า ใช้ร่วมกันทุกหน้าแทนการเขียน h1 + p + ปุ่ม ซ้ำในแต่ละไฟล์ */
export function PageHeader({ title, description, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          {description && <p className="mt-0.5 truncate text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
