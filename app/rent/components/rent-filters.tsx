"use client"

import { Filter } from "lucide-react"
import type { Condo } from "@/lib/supabase"
import { MONTHS_TH, PAYMENT_STATUS_OPTIONS, type PaymentStatusFilter } from "../constants"
import type { useRentFilters } from "../hooks/use-rent-filters"

const SELECT_CLASS =
  "px-2 py-1 sm:px-3 bg-muted border border-input rounded text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring"

const LABEL_CLASS = "text-xs sm:text-sm font-medium text-foreground"

export function RentFilters({
  filters,
  condos,
}: {
  filters: ReturnType<typeof useRentFilters>
  condos: Condo[]
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hidden sm:block" />

        <div className="flex items-center gap-1 sm:gap-2">
          <label className={LABEL_CLASS} htmlFor="rent-filter-condo">
            คอนโด:
          </label>
          <select
            id="rent-filter-condo"
            value={filters.selectedCondoFilter}
            onChange={(event) => filters.changeCondo(event.target.value)}
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
          <label className={LABEL_CLASS} htmlFor="rent-filter-tenant">
            ผู้เช่า:
          </label>
          <select
            id="rent-filter-tenant"
            value={filters.selectedTenantFilter}
            onChange={(event) => filters.setSelectedTenantFilter(event.target.value)}
            disabled={!filters.selectedCondoFilter}
            className={`${SELECT_CLASS} max-w-[100px] sm:max-w-none ${
              !filters.selectedCondoFilter ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <option value="">{filters.selectedCondoFilter ? "ทั้งหมด" : "เลือกคอนโดก่อน"}</option>
            {filters.tenantOptions.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mr-2" htmlFor="rent-filter-year">
            ปี:
          </label>
          <select
            id="rent-filter-year"
            value={filters.selectedYearFilter}
            onChange={(event) => filters.setSelectedYearFilter(event.target.value)}
            className="px-3 py-1 bg-muted border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">ทั้งหมด</option>
            {filters.years.map((year) => (
              <option key={year} value={year}>
                {year + 543}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mr-2" htmlFor="rent-filter-month">
            เดือน:
          </label>
          <select
            id="rent-filter-month"
            value={filters.selectedMonthFilter}
            onChange={(event) => filters.setSelectedMonthFilter(event.target.value)}
            className="px-3 py-1 bg-muted border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">ทั้งหมด</option>
            {MONTHS_TH.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mr-2" htmlFor="rent-filter-status">
            สถานะ:
          </label>
          <select
            id="rent-filter-status"
            value={filters.paymentStatusFilter}
            onChange={(event) => filters.setPaymentStatusFilter(event.target.value as PaymentStatusFilter)}
            className="px-3 py-1 bg-muted border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">ทั้งหมด</option>
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs sm:text-sm text-muted-foreground w-full sm:w-auto">
          พบ {filters.filteredPayments.length} รายการ
        </span>
      </div>
    </div>
  )
}
