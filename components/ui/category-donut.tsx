"use client"

import { useMemo } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { ChartEmpty, ChartTooltip, formatBaht, useChartTheme } from "@/lib/chart-theme"
import { cn } from "@/lib/utils"

interface DonutDatum {
  name: string
  value: number
  color?: string
}

interface CategoryDonutProps {
  data: DonutDatum[]
  /** ข้อความกลางวง เช่น "รวม" */
  centerLabel?: string
  formatValue?: (value: number) => string
  emptyMessage?: string
  height?: number
  /** จำนวนหมวดสูงสุดก่อนยุบส่วนที่เหลือเป็น "อื่น ๆ" */
  maxSlices?: number
  className?: string
}

/**
 * โดนัทพร้อมคำอธิบายด้านข้าง ใช้แทน PieChart + label รอบวงแบบเดิม
 * ที่ชนกันเมื่อมีหมวดหมู่เยอะ
 */
export function CategoryDonut({
  data,
  centerLabel = "รวม",
  formatValue = formatBaht,
  emptyMessage = "ไม่มีข้อมูล",
  height = 240,
  maxSlices = 6,
  className,
}: CategoryDonutProps) {
  const theme = useChartTheme()

  const palette = useMemo(
    () => [theme["chart-1"], theme["chart-2"], theme["chart-4"], theme["chart-3"], theme["chart-5"]],
    [theme],
  )

  const slices = useMemo(() => {
    const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value)
    if (sorted.length <= maxSlices) return sorted

    const head = sorted.slice(0, maxSlices - 1)
    const rest = sorted.slice(maxSlices - 1).reduce((sum, d) => sum + d.value, 0)
    return [...head, { name: "อื่น ๆ", value: rest }]
  }, [data, maxSlices])

  const total = slices.reduce((sum, d) => sum + d.value, 0)

  if (slices.length === 0 || total === 0) {
    return <ChartEmpty height={height} message={emptyMessage} />
  }

  const colored = slices.map((slice, index) => ({
    ...slice,
    color: slice.color ?? (slice.name === "อื่น ๆ" ? theme["muted-foreground"] : palette[index % palette.length]),
  }))

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row sm:items-start", className)}>
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={colored}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="none"
            >
              {colored.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <RechartsTooltip content={<ChartTooltip formatter={(value) => formatValue(value)} />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
          <span className="tabular text-base font-semibold text-foreground">{formatValue(total)}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-1.5">
        {colored.map((slice) => {
          const percent = Math.round((slice.value / total) * 100)
          return (
            <li key={slice.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} />
                <span className="truncate">{slice.name}</span>
              </span>
              <span className="tabular shrink-0 text-right">
                <span className="font-medium text-foreground">{formatValue(slice.value)}</span>
                <span className="ml-2 text-xs text-muted-foreground">{percent}%</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
