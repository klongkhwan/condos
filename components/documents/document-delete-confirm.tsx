"use client"

import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import type { DocToDelete } from "@/lib/hooks/use-document-manager"

/** กล่องยืนยันการลบเอกสาร ใช้คู่กับ useDocumentManager */
export function DocumentDeleteConfirm({
  doc,
  onCancel,
  onConfirm,
  isDeleting,
}: {
  doc: DocToDelete | null
  onCancel: () => void
  onConfirm: () => void
  isDeleting: boolean
}) {
  return (
    <ConfirmationModal
      isOpen={!!doc}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="ยืนยันการลบเอกสาร"
      message={`คุณแน่ใจหรือไม่ว่าต้องการลบเอกสาร "${doc?.name || ""}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
      confirmText="ยืนยัน"
      cancelText="ยกเลิก"
      type="danger"
      isLoading={isDeleting}
      loadingText="กำลังลบ..."
    />
  )
}
