"use client"

import { useState } from "react"
import type { RentPayment } from "@/lib/supabase"
import { deletePaymentAction } from "@/app/actions/rent-actions"

type Notify = (state: { message: string; type: "success" | "error" | "info" }) => void

/** ยืนยัน + ลบรายการชำระค่าเช่า */
export function usePaymentDelete({ notify, onDeleted }: { notify: Notify; onDeleted: () => void }) {
  const [payment, setPayment] = useState<RentPayment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const requestDelete = (target: RentPayment) => setPayment(target)
  const cancelDelete = () => setPayment(null)

  const confirmDelete = async () => {
    if (!payment) return
    setIsDeleting(true)
    try {
      const result = await deletePaymentAction(payment.id)
      if (result.success) {
        notify({ message: "ลบรายการชำระเงินสำเร็จ", type: "success" })
        onDeleted()
      } else {
        notify({ message: result.message || "เกิดข้อผิดพลาดในการลบรายการชำระเงิน", type: "error" })
      }
    } catch (error: any) {
      console.error("Error deleting payment:", error)
      notify({ message: `เกิดข้อผิดพลาดในการลบรายการชำระเงิน: ${error.message}`, type: "error" })
    } finally {
      setIsDeleting(false)
      setPayment(null)
    }
  }

  return { payment, isDeleting, requestDelete, cancelDelete, confirmDelete }
}
