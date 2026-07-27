"use client"

import { useCallback, useState } from "react"
import { uploadDocument, deleteDocumentAction } from "@/app/actions/document-actions"

type Notify = (state: { message: string; type: "success" | "error" | "info" }) => void

export type DocToDelete = {
  id: string
  fileUrl: string
  name: string
}

/** ฟิลด์เพิ่มเติมที่ผูกเอกสารเข้ากับ record (condoId / tenantId / incomeId / expenseId / paymentId) */
export type UploadTargetFields = Record<string, string | undefined>

/**
 * รวม state การอัปโหลด/ลบเอกสารแนบ ที่เคยถูกประกาศซ้ำในหน้า financials / tenants / rent
 *
 * const docs = useDocumentManager({ notify: setNotification, onChanged: afterDocumentChange })
 * await docs.upload((file) => ({ condoId, tenantId, incomeId }))
 */
export function useDocumentManager({
  notify,
  onChanged,
}: {
  notify: Notify
  onChanged: () => void
}) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [documentType, setDocumentType] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [docToDelete, setDocToDelete] = useState<DocToDelete | null>(null)

  const resetUpload = useCallback(() => {
    setUploadedFiles([])
    setDocumentType("")
  }, [])

  /**
   * อัปโหลดไฟล์ที่เลือกไว้ทั้งหมด
   * @param buildFields สร้างฟิลด์ผูก record ต่อไฟล์
   * @param options.documentType บังคับประเภทเอกสาร (ใช้เมื่อหน้าไม่มี dropdown ให้เลือก)
   * @param options.silent ไม่แสดงการแจ้งเตือน (ให้ผู้เรียกแจ้งเอง)
   * @returns true เมื่ออัปโหลดครบทุกไฟล์
   */
  const upload = useCallback(
    async (
      buildFields: (file: File) => UploadTargetFields,
      options: { documentType?: string; silent?: boolean } = {},
    ): Promise<boolean> => {
      const type = options.documentType ?? documentType
      if (uploadedFiles.length === 0) return true

      setIsUploading(true)
      try {
        for (const file of uploadedFiles) {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("documentType", type)
          for (const [key, value] of Object.entries(buildFields(file))) {
            if (value) formData.append(key, value)
          }

          const result = await uploadDocument(formData)
          if (!result.success) throw new Error(result.message)
        }

        if (!options.silent) {
          notify({ message: `อัปโหลดไฟล์สำเร็จ ${uploadedFiles.length} ไฟล์`, type: "success" })
        }
        resetUpload()
        onChanged()
        return true
      } catch (error: any) {
        console.error("Error uploading files:", error)
        notify({ message: `เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ${error.message}`, type: "error" })
        return false
      } finally {
        setIsUploading(false)
      }
    },
    [documentType, uploadedFiles, notify, onChanged, resetUpload],
  )

  const requestDelete = useCallback((id: string, fileUrl: string, name: string) => {
    setDocToDelete({ id, fileUrl, name })
  }, [])

  const cancelDelete = useCallback(() => setDocToDelete(null), [])

  const confirmDelete = useCallback(async () => {
    if (!docToDelete) return
    setIsDeleting(true)
    try {
      const result = await deleteDocumentAction(docToDelete.id, docToDelete.fileUrl || "")
      if (!result.success) throw new Error(result.message)
      notify({ message: `เอกสาร "${docToDelete.name}" ถูกลบแล้ว`, type: "success" })
      onChanged()
    } catch (error: any) {
      console.error("Error deleting document:", error)
      notify({ message: `เกิดข้อผิดพลาดในการลบเอกสาร: ${error.message}`, type: "error" })
    } finally {
      setIsDeleting(false)
      setDocToDelete(null)
    }
  }, [docToDelete, notify, onChanged])

  return {
    uploadedFiles,
    setUploadedFiles,
    documentType,
    setDocumentType,
    isUploading,
    resetUpload,
    upload,
    docToDelete,
    isDeleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
  }
}
