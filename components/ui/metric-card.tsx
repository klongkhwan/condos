"use client"

import type React from "react"
import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type MetricTone = "neutral" | "success" | "warning" | "danger" | "info"

const toneRing: Record<MetricTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  danger: "bg-destructive-muted text-destructive",
  info: "bg-info-muted text-info",
}

const toneValue: Record<MetricTone, string> = {
  neutral: "text-foreground",
  success: "text-foreground",
  warning: "text-foreground",
  danger: "text-destructive",
  info: "text-foreground",
}

const toneSpark: Record<MetricTone, string> = {
  neutral: "stroke-muted-foreground",
  success: "stroke-success",
  warning: "stroke-warning",
  danger: "stroke-destructive",
  info: "stroke-info",
}

interface MetricCardProps {
  label: string
  value: string | number
  /** บรรทัดรองใต้ตัวเลข เช่น "11 จาก 12 ห้อง" */
  caption?: string
  icon?: LucideIcon
  tone?: MetricTone
  /** เปอร์เซ็นต์เทียบช่วงก่อนหน้า แสดงเป็นชิปพร้อมลูกศร */
  delta?: { value: number; label?: string }
  /** ชุดตัวเลขสำหรับ sparkline ขนาดเล็ก */
  spark?: number[]
  hint?: string
  loading?: boolean
  className?: string
  onClick?: () => void
}

function sparkPath(values: number[], width: number, height: number) {
  if (values.length < 2) return ""
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = width / (values.length - 1)
  return values
    .map((v, i) => {
      const x = Math.round(i * step * 10) / 10
      const y = Math.round((height - ((v - min) / span) * height) * 10) / 10
      return `${i === 0 ? "M" : "L"}${x},${y}`
    })
    .join(" ")
}

export function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
  tone = "neutral",
  delta,
  spark,
  hint,
  loading = false,
  className,
  onClick,
}: MetricCardProps) {
  const Wrapper = onClick ? "button" : "div"

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
          {hint && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`คำอธิบาย ${label}`}
                    className="rounded-full text-muted-foreground/70 transition-colors hover:text-foreground"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-56 text-xs">
                  {hint}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {Icon && (
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", toneRing[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-3 h-7 w-28 animate-pulse rounded-md bg-muted" />
      ) : (
        <p className={cn("tabular mt-2 text-2xl font-semibold tracking-tight sm:text-[1.75rem]", toneValue[tone])}>
          {value}
        </p>
      )}

      <div className="mt-1.5 flex min-h-5 items-center justify-between gap-2">
        {loading ? (
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            {delta && (
              <span
                className={cn(
                  "tabular inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                  delta.value >= 0 ? "bg-success-muted text-success" : "bg-destructive-muted text-destructive",
                )}
              >
                {delta.value >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(Math.round(delta.value * 10) / 10)}%
              </span>
            )}
            {caption && <span className="truncate text-xs text-muted-foreground">{caption}</span>}
          </div>
        )}

        {spark && spark.length > 1 && !loading && (
          <svg
            viewBox="0 0 64 20"
            className="h-5 w-16 shrink-0 overflow-visible"
            fill="none"
            aria-hidden="true"
            preserveAspectRatio="none"
          >
            <path
              d={sparkPath(spark, 64, 20)}
              className={toneSpark[tone]}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>
    </>
  )

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border bg-card p-4 text-left shadow-card transition-colors sm:p-5",
        onClick && "hover:border-border-strong hover:bg-surface-raised",
        className,
      )}
    >
      {body}
    </Wrapper>
  )
}
