import type React from "react"
import { AlertTriangle, Check, CircleDashed, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export type PaymentStatus = "paid" | "unpaid" | "overdue"

const paymentStatusMap: Record<
  PaymentStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  paid: { label: "ชำระแล้ว", icon: Check, className: "bg-success-muted text-success" },
  unpaid: { label: "ยังไม่ชำระ", icon: Clock, className: "bg-warning-muted text-warning" },
  overdue: { label: "เกินกำหนด", icon: AlertTriangle, className: "bg-destructive-muted text-destructive" },
}

/** ป้ายสถานะการชำระค่าเช่า ใช้ร่วมกันทุกหน้า แทนการเขียน switch สี/ไอคอนซ้ำในแต่ละไฟล์ */
export function PaymentStatusBadge({ status, className }: { status: string; className?: string }) {
  const config = paymentStatusMap[status as PaymentStatus] ?? {
    label: status,
    icon: CircleDashed,
    className: "bg-muted text-muted-foreground",
  }
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium",
        config.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  )
}

const toneMap = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  danger: "bg-destructive-muted text-destructive",
  info: "bg-info-muted text-info",
} as const

export function StatusBadge({
  children,
  tone = "neutral",
  icon: Icon,
  className,
}: {
  children: React.ReactNode
  tone?: keyof typeof toneMap
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium",
        toneMap[tone],
        className,
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  )
}
