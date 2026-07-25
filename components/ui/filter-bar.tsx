"use client"

import type React from "react"
import { useId } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"

/** แถบตัวกรองมาตรฐาน ใช้แทนกล่องกรองที่เขียนซ้ำในหน้า tenants / rent / financials / notifications */
export function FilterBar({
  children,
  onReset,
  className,
}: {
  children: React.ReactNode
  onReset?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-card sm:gap-3 sm:p-4",
        className,
      )}
    >
      <SlidersHorizontal className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
      {children}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          ล้างตัวกรอง
        </button>
      )}
    </div>
  )
}

export function FilterSelect({
  label,
  value,
  onChange,
  children,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  className?: string
}) {
  const id = useId()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label htmlFor={id} className="whitespace-nowrap text-xs font-medium text-muted-foreground sm:text-sm">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-input bg-muted px-2 py-1.5 text-xs text-foreground transition-colors hover:border-border-strong focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring sm:px-3 sm:text-sm"
      >
        {children}
      </select>
    </div>
  )
}

export function FilterSearch({
  value,
  onChange,
  placeholder = "ค้นหา",
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const id = useId()

  return (
    <div className={cn("relative min-w-40 flex-1", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-md border border-input bg-muted py-1.5 pl-8 pr-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground hover:border-border-strong focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}
