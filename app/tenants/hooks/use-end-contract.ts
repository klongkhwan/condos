"use client"

import type React from "react"
import { useState } from "react"
import type { Tenant } from "@/lib/supabase"
import { todayISO } from "@/lib/date-utils"
import { endTenantContractAction } from "@/app/actions/tenant-actions"

type Notify = (state: { message: string; type: "success" | "error" | "info" }) => void

type EndReason = "expired" | "early_termination" | "changed_tenant"

const EMPTY_DATA = {
  end_reason: "expired" as EndReason,
  actual_end_date: "",
  notes: "",
}

/** flow สิ้นสุดสัญญาเช่า → ย้ายผู้เช่าไปยัง tenant_history */
export function useEndContract({ notify, onEnded }: { notify: Notify; onEnded: () => void }) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [data, setData] = useState(EMPTY_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const open = (target: Tenant) => {
    setTenant(target)
    setData({ ...EMPTY_DATA, actual_end_date: todayISO() })
  }

  const close = () => setTenant(null)

  const setField = <K extends keyof typeof EMPTY_DATA>(field: K, value: (typeof EMPTY_DATA)[K]) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!tenant) return

    setIsSubmitting(true)
    try {
      const result = await endTenantContractAction(tenant.id, tenant, {
        end_reason: data.end_reason,
        actual_end_date: data.actual_end_date,
        notes: data.notes,
      })
      if (!result.success) throw new Error(result.message)

      onEnded()
      setTenant(null)
      setData(EMPTY_DATA)
      notify({ message: "สิ้นสุดสัญญาเรียบร้อยแล้ว", type: "success" })
    } catch (error: any) {
      console.error("Error ending contract:", error)
      notify({ message: `เกิดข้อผิดพลาดในการสิ้นสุดสัญญา: ${error.message}`, type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return { tenant, data, isSubmitting, open, close, setField, handleSubmit }
}
