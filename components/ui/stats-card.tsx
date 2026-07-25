"use client"

import type { LucideIcon } from "lucide-react"
import { MetricCard, type MetricTone } from "@/components/ui/metric-card"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  iconColor?: "green" | "red" | "yellow" | "blue" | "purple"
  tooltip?: string
  className?: string
  valueClassName?: string
  loading?: boolean
}

const toneByColor: Record<NonNullable<StatsCardProps["iconColor"]>, MetricTone> = {
  green: "success",
  red: "danger",
  yellow: "warning",
  blue: "info",
  purple: "neutral",
}

/**
 * ชั้นความเข้ากันได้กับหน้าเดิม — ภายในเรนเดอร์ด้วย MetricCard
 * โค้ดใหม่ควรเรียก MetricCard โดยตรงเพื่อใช้ delta chip และ sparkline
 */
export function StatsCard({
  title,
  value,
  icon,
  trend,
  iconColor = "green",
  tooltip,
  className,
  loading = false,
}: StatsCardProps) {
  const caption = trend
    ? `${trend.isPositive ? "+" : ""}${trend.value}${trend.label ?? "%"}`
    : undefined

  return (
    <MetricCard
      label={title}
      value={value}
      icon={icon}
      tone={toneByColor[iconColor]}
      caption={caption}
      hint={tooltip}
      loading={loading}
      className={className}
    />
  )
}
