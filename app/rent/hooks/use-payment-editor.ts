"use client"

import type React from "react"
import { useState } from "react"
import type { RentPayment, Tenant } from "@/lib/supabase"
import { useDocuments } from "@/lib/hooks/use-queries"
import { useDocumentManager } from "@/lib/hooks/use-document-manager"
import { createPaymentAction, updatePaymentAction } from "@/app/actions/rent-actions"
import type { PaymentStatus } from "../constants"

type Notify = (state: { message: string; type: "success" | "error" | "info" }) => void

const EMPTY_FORM = {
  tenant_id: "",
  amount: "",
  due_date: "",
  paid_date: "",
  status: "unpaid" as PaymentStatus,
  notes: "",
}

type FormErrors = Partial<Record<"tenant_id" | "amount" | "due_date" | "paid_date", string>>

/**
 * ฟอร์มเพิ่ม/แก้ไขรายการค่าเช่า รวมการแนบสลิปการชำระ
 * (ไฟล์จะถูกอัปโหลดหลังบันทึกรายการสำเร็จ เพราะต้องใช้ payment id)
 */
export function usePaymentEditor({
  tenants,
  notify,
  onSaved,
  onDocumentsChanged,
}: {
  tenants: Tenant[]
  notify: Notify
  onSaved: () => void
  onDocumentsChanged: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<RentPayment | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  const docs = useDocumentManager({ notify, onChanged: onDocumentsChanged })

  const { documents, loading: documentsLoading } = useDocuments({
    paymentId: selectedPayment?.id,
    documentType: "payment_receipt",
  })

  const clearError = (field: keyof FormErrors) => {
    setFormErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const setField = <K extends keyof typeof EMPTY_FORM>(field: K, value: (typeof EMPTY_FORM)[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    clearError(field as keyof FormErrors)
  }

  /** เลือกผู้เช่าแล้วเติมค่าเช่ารายเดือนของสัญญานั้นให้อัตโนมัติ */
  const selectTenant = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId)
    setFormData((prev) => ({ ...prev, tenant_id: tenantId, amount: tenant?.monthly_rent.toString() || "" }))
    clearError("tenant_id")
  }

  const validate = () => {
    const errors: FormErrors = {}
    if (!formData.tenant_id) errors.tenant_id = "กรุณาเลือกผู้เช่า"
    if (!formData.amount) errors.amount = "กรุณากรอกจำนวนเงิน"
    if (!formData.due_date) errors.due_date = "กรุณาเลือกวันครบกำหนด"
    if (formData.status === "paid" && !formData.paid_date) errors.paid_date = "กรุณาเลือกวันที่ชำระ"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const close = () => {
    setIsOpen(false)
    setSelectedPayment(null)
    setFormErrors({})
    docs.resetUpload()
  }

  const openCreate = () => {
    setSelectedPayment(null)
    setFormData(EMPTY_FORM)
    setFormErrors({})
    docs.resetUpload()
    setIsOpen(true)
  }

  const openEdit = (payment: RentPayment) => {
    setSelectedPayment(payment)
    setFormData({
      tenant_id: payment.tenant_id,
      amount: payment.amount.toString(),
      due_date: payment.due_date,
      paid_date: payment.paid_date || "",
      status: payment.status,
      notes: payment.notes || "",
    })
    setFormErrors({})
    docs.resetUpload()
    setIsOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setIsSaving(true)
    const paymentData = {
      tenant_id: formData.tenant_id,
      amount: Number.parseFloat(formData.amount),
      due_date: formData.due_date,
      paid_date: formData.paid_date || undefined,
      status: formData.status,
      notes: formData.notes || undefined,
    }

    const fileCount = docs.uploadedFiles.length

    try {
      const result = selectedPayment
        ? await updatePaymentAction(selectedPayment.id, paymentData)
        : await createPaymentAction(paymentData)

      if (!result.success) {
        notify({ message: result.message || "เกิดข้อผิดพลาดในการบันทึกรายการชำระเงิน", type: "error" })
        return
      }

      const savedPaymentId = selectedPayment ? selectedPayment.id : result.data?.id
      onSaved()

      if (fileCount > 0 && savedPaymentId) {
        const condoId = tenants.find((t) => t.id === formData.tenant_id)?.condo_id || ""
        const uploaded = await docs.upload(
          () => ({ condoId, paymentId: savedPaymentId, tenantId: formData.tenant_id }),
          { documentType: "payment_receipt", silent: true },
        )
        if (uploaded) {
          notify({ message: `บันทึกข้อมูลและ ${fileCount} ไฟล์สำเร็จ`, type: "success" })
        }
      } else {
        notify({ message: "บันทึกสำเร็จ", type: "success" })
      }

      close()
    } catch (error: any) {
      console.error("Error saving payment record:", error)
      notify({ message: `เกิดข้อผิดพลาดในการบันทึกรายการชำระเงิน: ${error.message}`, type: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  return {
    isOpen,
    selectedPayment,
    formData,
    formErrors,
    isSaving,
    setField,
    selectTenant,
    openCreate,
    openEdit,
    close,
    handleSubmit,
    docs,
    documents,
    documentsLoading,
  }
}
