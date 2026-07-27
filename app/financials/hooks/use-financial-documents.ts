"use client"

import { useState } from "react"
import type { ExpenseRecord, IncomeRecord } from "@/lib/supabase"
import { useDocuments } from "@/lib/hooks/use-queries"
import { useDocumentManager } from "@/lib/hooks/use-document-manager"
import type { RecordType } from "../constants"

type Notify = (state: { message: string; type: "success" | "error" | "info" }) => void

type SelectedRecord = {
  record: IncomeRecord | ExpenseRecord
  type: RecordType
}

/** เอกสารแนบของรายการรายรับ/รายจ่าย: เปิด modal, อัปโหลด, ลบ */
export function useFinancialDocuments({ notify, onChanged }: { notify: Notify; onChanged: () => void }) {
  const [selected, setSelected] = useState<SelectedRecord | null>(null)
  const manager = useDocumentManager({ notify, onChanged })

  const { documents, loading: documentsLoading } = useDocuments({
    incomeId: selected?.type === "income" ? selected.record.id : undefined,
    expenseId: selected?.type === "expense" ? selected.record.id : undefined,
    scope: selected ? selected.type : "any",
  })

  const openFileModal = (record: IncomeRecord | ExpenseRecord, type: RecordType) => {
    setSelected({ record, type })
    manager.resetUpload()
  }

  const closeFileModal = () => {
    setSelected(null)
    manager.resetUpload()
  }

  const submitUpload = async () => {
    if (!selected) return
    const { record, type } = selected
    const ok = await manager.upload(() => ({
      condoId: record.condo_id,
      tenantId: record.tenant_id,
      ...(type === "income" ? { incomeId: record.id } : { expenseId: record.id }),
    }))
    if (ok) setSelected(null)
  }

  return {
    ...manager,
    selected,
    documents,
    documentsLoading,
    openFileModal,
    closeFileModal,
    submitUpload,
  }
}
