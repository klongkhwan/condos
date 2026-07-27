"use client"

import { NumericFormat } from "react-number-format"
import { Modal } from "@/components/ui/modal"
import { Field, SelectField, TextAreaField, fieldClass } from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { FormActions } from "@/components/ui/form-actions"
import { DocumentPreview } from "@/components/ui/document-preview"
import { ImageCompressInput } from "@/components/ui/image-compress-input"
import type { Condo, Tenant } from "@/lib/supabase"
import { toDateValue, toISODateString } from "@/lib/date-utils"
import { PAYMENT_DOCUMENT_TYPES, PAYMENT_STATUS_OPTIONS, type PaymentStatus } from "../constants"
import type { usePaymentEditor } from "../hooks/use-payment-editor"

type EditorState = ReturnType<typeof usePaymentEditor>

export function PaymentFormModal({
  editor,
  tenants,
  condos,
}: {
  editor: EditorState
  tenants: Tenant[]
  condos: Condo[]
}) {
  const { formData, formErrors, selectedPayment, docs } = editor
  const isBusy = editor.isSaving || docs.isUploading

  return (
    <Modal
      isOpen={editor.isOpen}
      onClose={editor.close}
      title={selectedPayment ? "แก้ไขรายการค่าเช่า" : "เพิ่มรายการค่าเช่า"}
      size="lg"
    >
      <form onSubmit={editor.handleSubmit} className="space-y-3">
        <SelectField
          label="ผู้เช่า"
          required
          error={formErrors.tenant_id}
          value={formData.tenant_id}
          onChange={(event) => editor.selectTenant(event.target.value)}
          disabled={!!selectedPayment}
        >
          <option value="">เลือกผู้เช่า</option>
          {tenants
            .filter((tenant) => tenant.is_active || tenant.id === formData.tenant_id)
            .map((tenant) => {
              const condo = condos.find((c) => c.id === tenant.condo_id)
              return (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.full_name} - {condo?.name} ({condo?.room_number}) - ฿
                  {tenant.monthly_rent.toLocaleString()}
                </option>
              )
            })}
        </SelectField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Field label="จำนวนเงิน (บาท)" required error={formErrors.amount}>
            {(props) => (
              <NumericFormat
                {...props}
                thousandSeparator=","
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                value={formData.amount}
                onValueChange={(values) => editor.setField("amount", values.value)}
                className={fieldClass(!!formErrors.amount)}
                placeholder="0.00"
              />
            )}
          </Field>

          <DatePicker
            id="due_date"
            label="วันครบกำหนด"
            required
            value={toDateValue(formData.due_date)}
            onChange={(date) => editor.setField("due_date", toISODateString(date))}
            error={formErrors.due_date}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <SelectField
            label="สถานะ"
            required
            value={formData.status}
            onChange={(event) => editor.setField("status", event.target.value as PaymentStatus)}
          >
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>

          <DatePicker
            id="paid_date"
            label="วันที่ชำระ"
            required={formData.status === "paid"}
            value={toDateValue(formData.paid_date)}
            onChange={(date) => editor.setField("paid_date", toISODateString(date))}
            error={formErrors.paid_date}
          />
        </div>

        <ImageCompressInput
          files={docs.uploadedFiles}
          onFilesChange={docs.setUploadedFiles}
          label="แนบรูปภาพการจ่าย"
          accept="image/*,.pdf"
          maxSizeKB={100}
          disabled={isBusy}
          showCompressInfo={true}
        />

        {selectedPayment && editor.documents.length > 0 && (
          <DocumentPreview
            documents={editor.documents}
            documentTypes={PAYMENT_DOCUMENT_TYPES}
            loading={editor.documentsLoading}
            onDeleteDocument={docs.requestDelete}
            title="เอกสารที่แนบสำหรับรายการนี้"
            maxColumns={2}
          />
        )}

        <TextAreaField
          label="หมายเหตุ"
          value={formData.notes}
          onChange={(event) => editor.setField("notes", event.target.value)}
          rows={2}
          placeholder="หมายเหตุเพิ่มเติม..."
        />

        <FormActions
          onCancel={editor.close}
          isSubmitting={isBusy}
          loadingLabel={docs.isUploading ? "กำลังอัปโหลด..." : "กำลังบันทึก..."}
        />
      </form>
    </Modal>
  )
}
