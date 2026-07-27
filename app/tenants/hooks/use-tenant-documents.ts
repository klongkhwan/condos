"use client"

import { useState } from "react"
import type { Tenant } from "@/lib/supabase"
import { useDocuments } from "@/lib/hooks/use-queries"
import { useDocumentManager } from "@/lib/hooks/use-document-manager"

type Notify = (state: { message: string; type: "success" | "error" | "info" }) => void

/** เอกสารแนบของผู้เช่า: เปิด modal, อัปโหลด, ลบ */
export function useTenantDocuments({ notify, onChanged }: { notify: Notify; onChanged: () => void }) {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const manager = useDocumentManager({ notify, onChanged })

  const { documents, loading: documentsLoading } = useDocuments({
    tenantId: selectedTenant?.id,
    scope: "tenant",
  })

  const openFileModal = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    manager.resetUpload()
  }

  const closeFileModal = () => {
    setSelectedTenant(null)
    manager.resetUpload()
  }

  const submitUpload = async () => {
    if (!selectedTenant) return
    const ok = await manager.upload(() => ({
      tenantId: selectedTenant.id,
      condoId: selectedTenant.condo_id,
    }))
    if (ok) setSelectedTenant(null)
  }

  return {
    ...manager,
    selectedTenant,
    documents,
    documentsLoading,
    openFileModal,
    closeFileModal,
    submitUpload,
  }
}
