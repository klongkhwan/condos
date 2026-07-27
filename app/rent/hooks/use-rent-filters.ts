"use client"

import { useMemo, useState } from "react"
import type { RentPayment } from "@/lib/supabase"
import type { PaymentStatusFilter } from "../constants"

/** ตัวกรองของหน้าค่าเช่า: คอนโด / ผู้เช่า / ปี / เดือน / สถานะ */
export function useRentFilters(payments: RentPayment[]) {
  const [selectedCondoFilter, setSelectedCondoFilter] = useState("")
  const [selectedTenantFilter, setSelectedTenantFilter] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>("all")
  const [selectedYearFilter, setSelectedYearFilter] = useState("")
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("")

  /** เลือกคอนโดใหม่ต้องล้างผู้เช่าที่เลือกไว้ เพราะรายชื่อผูกกับคอนโด */
  const changeCondo = (condoId: string) => {
    setSelectedCondoFilter(condoId)
    setSelectedTenantFilter("")
  }

  /** ผู้เช่าที่เคยมีรายการชำระในคอนโดที่เลือก (รวมผู้เช่าเก่า) */
  const tenantOptions = useMemo(() => {
    if (!selectedCondoFilter) return []

    const tenantMap = new Map<string, { id: string; full_name: string }>()
    payments
      .filter((p) => p.tenant?.condo_id === selectedCondoFilter)
      .forEach((p) => {
        if (p.tenant && !tenantMap.has(p.tenant_id)) {
          tenantMap.set(p.tenant_id, { id: p.tenant_id, full_name: p.tenant.full_name || "ไม่ทราบชื่อ" })
        }
      })

    return Array.from(tenantMap.values())
  }, [payments, selectedCondoFilter])

  /** ย้อนหลัง 5 ปี ถึงล่วงหน้า 1 ปี */
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const yearList: number[] = []
    for (let year = currentYear + 1; year >= currentYear - 5; year--) yearList.push(year)
    return yearList
  }, [])

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        if (selectedCondoFilter && payment.tenant?.condo_id !== selectedCondoFilter) return false
        if (selectedTenantFilter && payment.tenant_id !== selectedTenantFilter) return false
        if (paymentStatusFilter !== "all" && payment.status !== paymentStatusFilter) return false

        if (selectedYearFilter) {
          if (!payment.due_date) return false
          if (new Date(payment.due_date).getFullYear() !== Number.parseInt(selectedYearFilter)) return false
        }

        if (selectedMonthFilter) {
          if (!payment.due_date) return false
          if (new Date(payment.due_date).getMonth() + 1 !== Number.parseInt(selectedMonthFilter)) return false
        }

        return true
      }),
    [payments, selectedCondoFilter, selectedTenantFilter, paymentStatusFilter, selectedYearFilter, selectedMonthFilter],
  )

  const countByStatus = useMemo(
    () => ({
      unpaid: filteredPayments.filter((p) => p.status === "unpaid").length,
      overdue: filteredPayments.filter((p) => p.status === "overdue").length,
      paid: filteredPayments.filter((p) => p.status === "paid").length,
    }),
    [filteredPayments],
  )

  const clearAll = () => {
    setSelectedCondoFilter("")
    setSelectedTenantFilter("")
    setPaymentStatusFilter("all")
    setSelectedYearFilter("")
    setSelectedMonthFilter("")
  }

  return {
    selectedCondoFilter,
    changeCondo,
    selectedTenantFilter,
    setSelectedTenantFilter,
    paymentStatusFilter,
    setPaymentStatusFilter,
    selectedYearFilter,
    setSelectedYearFilter,
    selectedMonthFilter,
    setSelectedMonthFilter,
    tenantOptions,
    years,
    filteredPayments,
    countByStatus,
    clearAll,
  }
}
