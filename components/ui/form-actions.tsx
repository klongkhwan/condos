"use client"

import { Loader2 } from "lucide-react"

/**
 * แถบปุ่ม ยกเลิก/บันทึก ท้ายฟอร์มใน Modal
 * แทนบล็อกปุ่มที่เคยคัดลอกซ้ำในทุกหน้า (financials / tenants / rent)
 */
export function FormActions({
  onCancel,
  onSubmit,
  isSubmitting = false,
  disabled = false,
  submitLabel = "บันทึก",
  loadingLabel = "กำลังบันทึก...",
  cancelLabel = "ยกเลิก",
}: {
  onCancel: () => void
  /** ระบุเมื่อปุ่มบันทึกไม่ได้อยู่ใน <form> (type="button") */
  onSubmit?: () => void
  isSubmitting?: boolean
  disabled?: boolean
  submitLabel?: string
  loadingLabel?: string
  cancelLabel?: string
}) {
  return (
    <div className="flex justify-end space-x-3 pt-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/90 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cancelLabel}
      </button>
      <button
        type={onSubmit ? "button" : "submit"}
        onClick={onSubmit}
        disabled={isSubmitting || disabled}
        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {loadingLabel}
          </>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  )
}
