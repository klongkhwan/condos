"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

/**
 * Recharts วาดสีลงบน SVG attribute ซึ่งไม่ resolve var(--token)
 * จึงต้องอ่านค่า CSS variable ออกมาเป็น hsl() string ตอน runtime
 * และอ่านใหม่เมื่อสลับธีม
 */
const TOKENS = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-grid",
  "muted-foreground",
  "foreground",
  "background",
  "card",
  "border",
  "success",
  "warning",
  "destructive",
  "info",
  "primary",
] as const

export type ChartTheme = Record<(typeof TOKENS)[number], string>

const FALLBACK: ChartTheme = {
  "chart-1": "hsl(213 84% 62%)",
  "chart-2": "hsl(158 64% 46%)",
  "chart-3": "hsl(16 84% 60%)",
  "chart-4": "hsl(41 94% 58%)",
  "chart-5": "hsl(265 72% 68%)",
  "chart-grid": "hsl(222 14% 18%)",
  "muted-foreground": "hsl(218 12% 65%)",
  foreground: "hsl(210 20% 98%)",
  background: "hsl(224 18% 7%)",
  card: "hsl(222 16% 10%)",
  border: "hsl(222 14% 18%)",
  success: "hsl(158 64% 42%)",
  warning: "hsl(38 92% 52%)",
  destructive: "hsl(0 72% 58%)",
  info: "hsl(213 84% 60%)",
  primary: "hsl(158 64% 42%)",
}

export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme()
  const [theme, setTheme] = useState<ChartTheme>(FALLBACK)

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    const next = {} as ChartTheme
    for (const token of TOKENS) {
      const raw = styles.getPropertyValue(`--${token}`).trim()
      next[token] = raw ? `hsl(${raw})` : FALLBACK[token]
    }
    setTheme(next)
  }, [resolvedTheme])

  return theme
}

export const formatBaht = (value: number) =>
  `฿${Math.round(value).toLocaleString("th-TH")}`

/** 60000 → "฿60k" ไม่ใช่ "฿60.0k" เศษ .0 บนแกนเป็น noise เปล่า ๆ */
const trim = (value: number, digits: number) => {
  const text = value.toFixed(digits)
  return text.endsWith(".0") ? text.slice(0, -2) : text
}

export const formatCompactBaht = (value: number) => {
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  if (abs >= 1_000_000) return `${sign}฿${trim(abs / 1_000_000, abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1_000) return `${sign}฿${trim(abs / 1_000, abs >= 100_000 ? 0 : 1)}k`
  return `${sign}฿${Math.round(abs)}`
}

/** props มาตรฐานของแกน ใช้ให้ทุกกราฟหน้าตาเหมือนกัน */
export function axisProps(theme: ChartTheme) {
  return {
    stroke: theme["muted-foreground"],
    tick: { fill: theme["muted-foreground"], fontSize: 12 },
    tickLine: false as const,
    axisLine: false as const,
  }
}

export function gridProps(theme: ChartTheme) {
  return {
    stroke: theme["chart-grid"],
    strokeDasharray: "4 4",
    vertical: false as const,
  }
}

interface TooltipEntry {
  name?: string
  value?: number
  color?: string
  dataKey?: string | number
  payload?: Record<string, unknown>
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
  /** ฟอร์แมตค่าตัวเลข ค่าเริ่มต้นเป็นสกุลบาท */
  formatter?: (value: number, entry: TooltipEntry) => string
  labelFormatter?: (label: string | number) => string
  /** แสดงผลรวมของทุกชุดข้อมูลใต้รายการ */
  showTotal?: boolean
}

/** Pie/Cell ไม่ส่ง entry.color มา ต้องถอยไปอ่าน fill จาก payload แทน */
function swatchColor(entry: TooltipEntry) {
  if (entry.color) return entry.color
  const fill = entry.payload?.fill
  return typeof fill === "string" ? fill : undefined
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  showTotal = false,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  const format = formatter ?? ((value: number) => formatBaht(value))
  const total = payload.reduce((sum, entry) => sum + (entry.value ?? 0), 0)

  return (
    <div className="min-w-40 rounded-lg border border-border bg-popover/95 p-3 shadow-overlay backdrop-blur-sm">
      {label !== undefined && (
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: swatchColor(entry) }} />
              {entry.name}
            </span>
            <span className="tabular font-medium text-foreground">{format(entry.value ?? 0, entry)}</span>
          </div>
        ))}
      </div>
      {showTotal && payload.length > 1 && (
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-border pt-2 text-xs">
          <span className="text-muted-foreground">รวม</span>
          <span className="tabular font-medium text-foreground">{format(total, payload[0])}</span>
        </div>
      )}
    </div>
  )
}

interface LegendItem {
  label: string
  color: string
  value?: string | number
  /** รูปแบบสัญลักษณ์: สี่เหลี่ยมสำหรับแท่ง, เส้นทึบ/เส้นประสำหรับกราฟเส้น */
  variant?: "square" | "line" | "dashed"
}

function LegendSwatch({ color, variant = "square" }: { color: string; variant?: LegendItem["variant"] }) {
  if (variant === "square") {
    return <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
  }

  return (
    <span
      className="h-0 w-4 shrink-0"
      style={{
        borderTopWidth: 2,
        borderTopStyle: variant === "dashed" ? "dashed" : "solid",
        borderTopColor: color,
      }}
    />
  )
}

export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 ${className ?? ""}`}>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <LegendSwatch color={item.color} variant={item.variant} />
          {item.label}
          {item.value !== undefined && <span className="tabular font-medium text-foreground">{item.value}</span>}
        </span>
      ))}
    </div>
  )
}

/** gradient สำหรับ Area/Bar ให้ไล่จางลงด้านล่าง ใส่ไว้ใน <defs> ของกราฟ */
export function ChartGradient({ id, color, from = 0.28, to = 0 }: { id: string; color: string; from?: number; to?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={from} />
      <stop offset="100%" stopColor={color} stopOpacity={to} />
    </linearGradient>
  )
}

export function ChartEmpty({ message = "ยังไม่มีข้อมูล", height = 240 }: { message?: string; height?: number }) {
  return (
    <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
      {message}
    </div>
  )
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2 px-1" style={{ height }} aria-hidden="true">
      {[52, 74, 46, 88, 63, 96].map((h, i) => (
        <div key={i} className="flex-1 animate-pulse rounded-t-md bg-muted" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

export function ChartFrame({ children, height }: { children: React.ReactNode; height: number }) {
  return (
    <div className="w-full" style={{ height }}>
      {children}
    </div>
  )
}
