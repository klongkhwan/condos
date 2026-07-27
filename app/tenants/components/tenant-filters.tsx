"use client"

import { Filter } from "lucide-react"
import type { Condo } from "@/lib/supabase"
import type { StatusFilter } from "../constants"

const SELECT_CLASS =
  "px-2 py-1 sm:px-3 bg-muted border border-input rounded text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring"

const LABEL_CLASS = "text-xs sm:text-sm font-medium text-foreground"

export function TenantFilters({
  condos,
  statusFilter,
  onStatusChange,
  selectedCondo,
  onCondoChange,
  resultCount,
}: {
  condos: Condo[]
  statusFilter: StatusFilter
  onStatusChange: (value: StatusFilter) => void
  selectedCondo: string
  onCondoChange: (value: string) => void
  resultCount: number
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hidden sm:block" />
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <label className={LABEL_CLASS} htmlFor="tenants-filter-status">
              สถานะ:
            </label>
            <select
              id="tenants-filter-status"
              value={statusFilter}
              onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
              className={SELECT_CLASS}
            >
              <option value="active">มีผู้เช่า</option>
              <option value="vacant">ห้องว่าง</option>
              <option value="all">ทั้งหมด</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={LABEL_CLASS} htmlFor="tenants-filter-condo">
              คอนโด:
            </label>
            <select
              id="tenants-filter-condo"
              value={selectedCondo}
              onChange={(event) => onCondoChange(event.target.value)}
              className={`${SELECT_CLASS} max-w-[120px] sm:max-w-none`}
            >
              <option value="">ทั้งหมด</option>
              {condos.map((condo) => (
                <option key={condo.id} value={condo.id}>
                  {condo.name} ({condo.room_number})
                </option>
              ))}
            </select>
          </div>
        </div>
        <span className="text-xs sm:text-sm text-muted-foreground">พบ {resultCount} รายการ</span>
      </div>
    </div>
  )
}
