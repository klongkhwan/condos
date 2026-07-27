"use client"

import { useState } from "react"
import { deleteExpenseAction, deleteIncomeAction } from "@/app/actions/financial-actions"
import type { RecordType } from "../constants"

type Notify = (state: { message: string; type: "success" | "error" | "info" }) => void

type PendingDelete = { id: string; type: RecordType; name: string }

/** ยืนยัน + ลบรายการรายรับ/รายจ่าย */
export function useRecordDelete({ notify, onDeleted }: { notify: Notify; onDeleted: () => void }) {
  const [pending, setPending] = useState<PendingDelete | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const requestDelete = (id: string, type: RecordType, name: string) => setPending({ id, type, name })

  const cancelDelete = () => setPending(null)

  const confirmDelete = async () => {
    if (!pending) return
    setIsDeleting(true)
    try {
      const result =
        pending.type === "income" ? await deleteIncomeAction(pending.id) : await deleteExpenseAction(pending.id)
      if (!result.success) throw new Error(result.message)

      notify({ message: "ลบสำเร็จ", type: "success" })
      onDeleted()
    } catch (error: any) {
      console.error("Error deleting record:", error)
      notify({ message: `การลบเกิดผิดพลาด: ${error.message || ""}`, type: "error" })
    } finally {
      setIsDeleting(false)
      setPending(null)
    }
  }

  return { pending, isDeleting, requestDelete, cancelDelete, confirmDelete }
}
