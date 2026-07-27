"use client"

import type React from "react"
import { Modal } from "@/components/ui/modal"
import { fieldClass } from "@/components/ui/field"
import { DocumentPreview } from "@/components/ui/document-preview"
import { ImageCompressInput } from "@/components/ui/image-compress-input"
import type { Document } from "@/lib/supabase"

export type DocumentTypeOption = { value: string; label: string }

/**
 * Modal แนบไฟล์เอกสาร ใช้ร่วมกันระหว่างหน้า financials / tenants
 * (เลือกประเภทเอกสาร → เลือกไฟล์ → แสดงเอกสารที่มีอยู่ → บันทึก)
 */
export function DocumentUploadModal({
  isOpen,
  onClose,
  title,
  description,
  documentTypes,
  documentType,
  onDocumentTypeChange,
  files,
  onFilesChange,
  documents,
  documentsLoading,
  onDeleteDocument,
  onSubmit,
  isUploading,
  existingTitle = "เอกสารที่มีอยู่",
  showEmptyDocuments = false,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: React.ReactNode
  documentTypes: DocumentTypeOption[]
  documentType: string
  onDocumentTypeChange: (value: string) => void
  files: File[]
  onFilesChange: (files: File[]) => void
  documents: Document[]
  documentsLoading?: boolean
  onDeleteDocument: (docId: string, fileUrl: string, docName: string) => void
  onSubmit: () => void
  isUploading: boolean
  existingTitle?: string
  /** แสดงกล่องเอกสาร (พร้อม empty state) แม้ยังไม่มีเอกสารแนบ */
  showEmptyDocuments?: boolean
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        {description && <p className="text-sm text-muted-foreground">{description}</p>}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="document-type">
            ประเภทเอกสาร <span className="text-destructive">*</span>
          </label>
          <select
            id="document-type"
            required
            value={documentType}
            onChange={(event) => onDocumentTypeChange(event.target.value)}
            className={fieldClass()}
          >
            <option value="">เลือกประเภทเอกสาร</option>
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <ImageCompressInput
          files={files}
          onFilesChange={onFilesChange}
          label="เลือกไฟล์เอกสาร"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
          maxSizeKB={100}
          disabled={isUploading}
          showCompressInfo={true}
        />

        {(showEmptyDocuments || documents.length > 0) && (
          <DocumentPreview
            documents={documents}
            documentTypes={documentTypes}
            loading={documentsLoading}
            onDeleteDocument={onDeleteDocument}
            title={existingTitle}
            maxColumns={2}
          />
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/90 hover:text-foreground transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={files.length === 0 || !documentType || isUploading}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? "กำลังอัปโหลด..." : `บันทึก (${files.length})`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
