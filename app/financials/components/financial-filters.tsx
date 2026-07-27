"use client"

import { Filter } from "lucide-react"
import type { Condo } from "@/lib/supabase"
import { MONTH_OPTIONS } from "../constants"

const SELECT_CLASS =
  "px-2 py-1 sm:px-3 bg-muted border border-input rounded text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring"

const LABEL_CLASS = "text-xs sm:text-sm font-medium text-foreground"

/** ตัวกรองร่วมของหน้าการเงิน: คอนโด / ปี / เดือน */
export function FinancialFilters({
  condos,
  selectedCondo,
  onCondoChange,
  selectedYear,
  onYearChange,
  yearOptions,
  selectedMonth,
  onMonthChange,
  resultCount,
}: {
  condos: Condo[]
  selectedCondo: string
  onCondoChange: (value: string) => void
  selectedYear: string
  onYearChange: (value: string) => void
  yearOptions: number[]
  selectedMonth: string
  onMonthChange: (value: string) => void
  resultCount: number
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hidden sm:block" />

        <div className="flex items-center gap-1 sm:gap-2">
          <label className={LABEL_CLASS} htmlFor="financials-filter-condo">
            คอนโด:
          </label>
          <select
            id="financials-filter-condo"
            value={selectedCondo}
            onChange={(event) => onCondoChange(event.target.value)}
            className={`${SELECT_CLASS} max-w-[100px] sm:max-w-none`}
          >
            <option value="">ทั้งหมด</option>
            {condos.map((condo) => (
              <option key={condo.id} value={condo.id}>
                {condo.name} ({condo.room_number})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <label className={LABEL_CLASS} htmlFor="financials-filter-year">
            ปี:
          </label>
          <select
            id="financials-filter-year"
            value={selectedYear}
            onChange={(event) => onYearChange(event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">ทุกปี</option>
            {yearOptions.map((year) => (
              <option key={year} value={year.toString()}>
                {year + 543}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <label className={LABEL_CLASS} htmlFor="financials-filter-month">
            เดือน:
          </label>
          <select
            id="financials-filter-month"
            value={selectedMonth}
            onChange={(event) => onMonthChange(event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">ทุกเดือน</option>
            {MONTH_OPTIONS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs sm:text-sm text-muted-foreground w-full sm:w-auto">พบ {resultCount} รายการ</span>
      </div>
    </div>
  )
}
