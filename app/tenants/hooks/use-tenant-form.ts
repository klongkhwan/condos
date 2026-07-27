"use client"

import type React from "react"
import { useState } from "react"
import type { Tenant } from "@/lib/supabase"
import { createTenantAction, updateTenantAction } from "@/app/actions/tenant-actions"

type Notify = (state: { message: string; type: "success" | "error" | "info" }) => void

const EMPTY_FORM = {
  condo_id: "",
  full_name: "",
  phone: "",
  line_id: "",
  rental_start: "",
  rental_end: "",
  deposit: "",
  monthly_rent: "",
}

type FormErrors = Partial<
  Record<"condo_id" | "full_name" | "rental_start" | "rental_end" | "monthly_rent", string>
>

/** ฟอร์มเพิ่ม/แก้ไขผู้เช่า */
export function useTenantForm({ notify, onSaved }: { notify: Notify; onSaved: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  const clearError = (field: keyof FormErrors) => {
    setFormErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const setField = <K extends keyof typeof EMPTY_FORM>(field: K, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    clearError(field as keyof FormErrors)
  }

  /** เลือกวันเริ่มเช่าแล้วเติมวันสิ้นสุดเป็น +1 ปีให้อัตโนมัติ */
  const setRentalStart = (startDate: string, endDate: string) => {
    setFormData((prev) => ({ ...prev, rental_start: startDate, rental_end: endDate || prev.rental_end }))
    clearError("rental_start")
  }

  const validate = () => {
    const errors: FormErrors = {}
    if (!formData.full_name.trim()) errors.full_name = "กรุณากรอกชื่อ-นามสกุล"
    if (!formData.condo_id) errors.condo_id = "กรุณาเลือกคอนโด"
    if (!formData.rental_start) errors.rental_start = "กรุณาเลือกวันที่เริ่มเช่า"
    if (!formData.rental_end) errors.rental_end = "กรุณาเลือกวันที่สิ้นสุดสัญญา"
    if (!formData.monthly_rent) errors.monthly_rent = "กรุณากรอกค่าเช่าต่อเดือน"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData(EMPTY_FORM)
    setFormErrors({})
    setEditingTenant(null)
    setIsModalOpen(false)
  }

  const openCreateModal = () => {
    setEditingTenant(null)
    setFormData(EMPTY_FORM)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (tenant: Tenant) => {
    setFormData({
      condo_id: tenant.condo_id,
      full_name: tenant.full_name,
      phone: tenant.phone || "",
      line_id: tenant.line_id || "",
      rental_start: tenant.rental_start,
      rental_end: tenant.rental_end,
      deposit: tenant.deposit?.toString() || "",
      monthly_rent: tenant.monthly_rent.toString(),
    })
    setFormErrors({})
    setEditingTenant(tenant)
    setIsModalOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setIsSaving(true)
    const tenantData = {
      condo_id: formData.condo_id,
      full_name: formData.full_name,
      phone: formData.phone || undefined,
      line_id: formData.line_id || undefined,
      rental_start: formData.rental_start,
      rental_end: formData.rental_end,
      deposit: formData.deposit ? Number.parseFloat(formData.deposit) : undefined,
      monthly_rent: Number.parseFloat(formData.monthly_rent),
      is_active: true,
      status: "active" as const,
    }

    try {
      const result = editingTenant
        ? await updateTenantAction(editingTenant.id, tenantData)
        : await createTenantAction(tenantData)

      if (!result.success) throw new Error(result.message)

      notify({ message: "บันทึกสำเร็จ", type: "success" })
      onSaved()
      resetForm()
    } catch (error: any) {
      console.error("Error saving tenant:", error)
      notify({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล", type: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  return {
    isModalOpen,
    editingTenant,
    formData,
    formErrors,
    isSaving,
    setField,
    setRentalStart,
    openCreateModal,
    openEditModal,
    resetForm,
    handleSubmit,
  }
}
