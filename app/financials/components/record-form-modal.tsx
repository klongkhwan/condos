"use client"

import { NumericFormat } from "react-number-format"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Field, SelectField, TextAreaField, TextField, fieldClass } from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { FormActions } from "@/components/ui/form-actions"
import type { Condo } from "@/lib/supabase"
import { toDateValue, toISODateString } from "@/lib/date-utils"
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type RecordType } from "../constants"
import type { useFinancialForm } from "../hooks/use-financial-form"

type FormState = ReturnType<typeof useFinancialForm>

export function RecordFormModal({ form, condos }: { form: FormState; condos: Condo[] }) {
  const { recordType, editingRecord, formData, formErrors, isSaving } = form
  const categories = recordType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <Modal
      isOpen={form.isModalOpen}
      onClose={form.resetForm}
      title={editingRecord ? `แก้ไข${recordType === "income" ? "รายรับ" : "รายจ่าย"}` : "บันทึกรายการ"}
      size="md"
    >
      <form onSubmit={form.handleSubmit} className="space-y-6">
        {!editingRecord && (
          <div className="grid grid-cols-2 gap-4">
            <RecordTypeButton
              type="income"
              label="รายรับ"
              icon={TrendingUp}
              active={recordType === "income"}
              onClick={form.switchRecordType}
            />
            <RecordTypeButton
              type="expense"
              label="รายจ่าย"
              icon={TrendingDown}
              active={recordType === "expense"}
              onClick={form.switchRecordType}
            />
          </div>
        )}

        <SelectField
          label="คอนโด"
          required
          error={formErrors.condo_id}
          value={formData.condo_id}
          onChange={(event) => form.setCondo(event.target.value)}
        >
          <option value="">เลือกคอนโด</option>
          {condos.map((condo) => (
            <option key={condo.id} value={condo.id}>
              {condo.name} ({condo.room_number})
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <TextField
            label="หัวข้อ"
            required
            error={formErrors.type}
            type="text"
            value={formData.type}
            onChange={(event) => form.setField("type", event.target.value)}
            placeholder={recordType === "income" ? "เช่น ค่าเช่ารายเดือน" : "เช่น ค่าซ่อมแอร์"}
          />

          <SelectField
            label="หมวดหมู่"
            required
            error={formErrors.category}
            value={formData.category}
            onChange={(event) => form.setField("category", event.target.value)}
          >
            <option value="">เลือกหมวดหมู่</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Field label="จำนวนเงิน (บาท)" required error={formErrors.amount}>
            {(props) => (
              <NumericFormat
                {...props}
                thousandSeparator=","
                decimalScale={2}
                allowNegative={false}
                value={formData.amount}
                onValueChange={(values) => form.setField("amount", values.value)}
                className={fieldClass(!!formErrors.amount)}
                placeholder="0.00"
              />
            )}
          </Field>

          <DatePicker
            id="financials-date"
            label="วันที่"
            required
            value={toDateValue(formData.date)}
            onChange={(date) => form.setField("date", toISODateString(date))}
            error={formErrors.date}
          />
        </div>

        <TextAreaField
          label="รายละเอียด"
          value={formData.description}
          onChange={(event) => form.setField("description", event.target.value)}
          rows={3}
          placeholder="รายละเอียดเพิ่มเติม..."
        />

        <FormActions onCancel={form.resetForm} isSubmitting={isSaving} />
      </form>
    </Modal>
  )
}

function RecordTypeButton({
  type,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  type: RecordType
  label: string
  icon: typeof TrendingUp
  active: boolean
  onClick: (type: RecordType) => void
}) {
  const activeClass =
    type === "income" ? "border-primary bg-success-muted text-success" : "border-destructive bg-destructive-muted text-destructive"

  return (
    <button
      type="button"
      onClick={() => onClick(type)}
      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
        active
          ? activeClass
          : "border-border bg-surface-raised text-muted-foreground hover:border-border-strong hover:bg-accent"
      }`}
    >
      <div
        className={`p-2 rounded-full mb-2 ${
          active ? (type === "income" ? "bg-success-muted" : "bg-destructive-muted") : "bg-muted"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className="font-medium text-base">{label}</span>
    </button>
  )
}
