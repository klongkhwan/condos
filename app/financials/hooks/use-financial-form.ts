"use client"

import type React from "react"
import { useCallback, useState } from "react"
import type { Condo, ExpenseRecord, IncomeRecord, Tenant } from "@/lib/supabase"
import { todayISO } from "@/lib/date-utils"
import {
  createExpenseAction,
  createIncomeAction,
  updateExpenseAction,
  updateIncomeAction,
} from "@/app/actions/financial-actions"
import type { RecordType } from "../constants"

type Notify = (state: { message: string; type: "success" | "error" | "info" }) => void

const EMPTY_FORM = {
  id: "",
  condo_id: "",
  tenant_id: "",
  type: "",
  amount: "",
  date: "",
  description: "",
  category: "",
}

type FormErrors = Partial<Record<"condo_id" | "type" | "category" | "amount" | "date", string>>

/** ฟอร์มเพิ่ม/แก้ไขรายรับ-รายจ่าย พร้อม validation และการเรียก server action */
export function useFinancialForm({
  condos,
  tenants,
  notify,
  onSaved,
}: {
  condos: Condo[]
  tenants: Tenant[]
  notify: Notify
  onSaved: () => void
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [recordType, setRecordType] = useState<RecordType>("income")
  const [editingRecord, setEditingRecord] = useState<IncomeRecord | ExpenseRecord | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  /** เลือกผู้เช่าที่ยัง active ของคอนโดนั้นก่อน ถ้าไม่มีค่อยใช้คนล่าสุดที่เคยเช่า */
  const pickTenantIdForCondo = useCallback(
    (condoId?: string) => {
      if (!condoId) return ""
      const active = tenants.find((t) => t.condo_id === condoId && t.is_active)
      if (active) return active.id
      return tenants.find((t) => t.condo_id === condoId)?.id || ""
    },
    [tenants],
  )

  const clearError = (field: keyof FormErrors) => {
    setFormErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  /** อัปเดตฟิลด์เดียวและล้าง error ของฟิลด์นั้น */
  const setField = <K extends keyof typeof EMPTY_FORM>(field: K, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    clearError(field as keyof FormErrors)
  }

  const setCondo = (condoId: string) => {
    setFormData((prev) => ({ ...prev, condo_id: condoId, tenant_id: pickTenantIdForCondo(condoId) }))
    clearError("condo_id")
  }

  /** สลับรายรับ/รายจ่าย ต้องล้างหมวดหมู่เพราะรายการหมวดหมู่คนละชุด */
  const switchRecordType = (type: RecordType) => {
    setRecordType(type)
    setFormData((prev) => ({ ...prev, category: "" }))
  }

  const validate = () => {
    const errors: FormErrors = {}
    if (!formData.condo_id) errors.condo_id = "กรุณาเลือกคอนโด"
    if (!formData.type) errors.type = "กรุณากรอกหัวข้อ"
    if (!formData.category) errors.category = "กรุณาเลือกหมวดหมู่"
    if (!formData.amount) errors.amount = "กรุณากรอกจำนวนเงิน"
    if (!formData.date) errors.date = "กรุณาเลือกวันที่"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData(EMPTY_FORM)
    setFormErrors({})
    setEditingRecord(null)
    setIsModalOpen(false)
  }

  const openModal = (type: RecordType, record?: IncomeRecord | ExpenseRecord) => {
    setRecordType(type)

    if (record) {
      setEditingRecord(record)
      setFormData({
        id: record.id,
        condo_id: record.condo_id,
        tenant_id: record.tenant_id || pickTenantIdForCondo(record.condo_id),
        type: record.type,
        amount: record.amount.toString(),
        date: record.date,
        description: record.description || "",
        category: record.category || "",
      })
    } else {
      const defaultCondoId = condos.length > 0 ? condos[0].id : ""
      setEditingRecord(null)
      setFormData({
        ...EMPTY_FORM,
        condo_id: defaultCondoId,
        tenant_id: pickTenantIdForCondo(defaultCondoId),
        date: todayISO(),
      })
    }

    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setIsSaving(true)
    const recordData = {
      condo_id: formData.condo_id,
      tenant_id: formData.tenant_id || undefined,
      type: formData.type,
      amount: Number.parseFloat(formData.amount),
      date: formData.date,
      description: formData.description || undefined,
      category: formData.category || undefined,
    }

    try {
      const action = editingRecord
        ? recordType === "income"
          ? () => updateIncomeAction(editingRecord.id, recordData)
          : () => updateExpenseAction(editingRecord.id, recordData)
        : recordType === "income"
          ? () => createIncomeAction(recordData)
          : () => createExpenseAction(recordData)

      const result = await action()
      if (!result.success) throw new Error(result.message)

      notify({ message: "บันทึกสำเร็จ", type: "success" })
      onSaved()
      resetForm()
    } catch (error: any) {
      console.error(`Error saving ${recordType} record:`, error)
      notify({ message: `บันทึกเกิดข้อผิดพลาด: ${error.message || ""}`, type: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  /** เปิดฟอร์มแก้ไข — เรียงพารามิเตอร์ให้ตรงกับ callback ของตาราง */
  const editRecord = (record: IncomeRecord | ExpenseRecord, type: RecordType) => openModal(type, record)

  return {
    isModalOpen,
    recordType,
    editingRecord,
    formData,
    formErrors,
    isSaving,
    setField,
    setCondo,
    switchRecordType,
    openModal,
    editRecord,
    resetForm,
    handleSubmit,
  }
}
