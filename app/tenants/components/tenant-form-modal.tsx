"use client"

import { Modal } from "@/components/ui/modal"
import { SelectField, TextField } from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { FormActions } from "@/components/ui/form-actions"
import type { Condo, Tenant } from "@/lib/supabase"
import { toDateValue, toISODateString } from "@/lib/date-utils"
import type { useTenantForm } from "../hooks/use-tenant-form"

type FormState = ReturnType<typeof useTenantForm>

export function TenantFormModal({
  form,
  condos,
  tenants,
}: {
  form: FormState
  condos: Condo[]
  tenants: Tenant[]
}) {
  const { formData, formErrors, editingTenant } = form

  /** วันสิ้นสุดสัญญาเริ่มต้น = วันเริ่มเช่า + 1 ปี */
  const handleStartChange = (date?: Date) => {
    if (!date) {
      form.setRentalStart("", "")
      return
    }
    const endDate = new Date(date)
    endDate.setFullYear(date.getFullYear() + 1)
    form.setRentalStart(toISODateString(date), toISODateString(endDate))
  }

  return (
    <Modal
      isOpen={form.isModalOpen}
      onClose={form.resetForm}
      title={editingTenant ? "แก้ไขผู้เช่า" : "เพิ่มผู้เช่าใหม่"}
      size="lg"
    >
      <form onSubmit={form.handleSubmit} className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <TextField
            label="ชื่อ-นามสกุล"
            required
            error={formErrors.full_name}
            type="text"
            value={formData.full_name}
            onChange={(event) => form.setField("full_name", event.target.value)}
          />

          <SelectField
            label="คอนโด"
            required
            error={formErrors.condo_id}
            value={formData.condo_id}
            onChange={(event) => form.setField("condo_id", event.target.value)}
          >
            <option value="">เลือกคอนโด</option>
            {condos.map((condo) => {
              const isOccupied = tenants.some(
                (t) => t.is_active && t.condo_id === condo.id && t.id !== editingTenant?.id,
              )
              return (
                <option key={condo.id} value={condo.id} disabled={isOccupied}>
                  {condo.name} ({condo.room_number}) {isOccupied ? "(ไม่ว่าง)" : ""}
                </option>
              )
            })}
          </SelectField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="เบอร์โทรศัพท์"
            type="tel"
            value={formData.phone}
            onChange={(event) => form.setField("phone", event.target.value)}
          />
          <TextField
            label="Line ID"
            type="text"
            value={formData.line_id}
            onChange={(event) => form.setField("line_id", event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            id="rental_start"
            label="วันที่เริ่มเช่า"
            required
            value={toDateValue(formData.rental_start)}
            onChange={handleStartChange}
            error={formErrors.rental_start}
          />
          <DatePicker
            id="rental_end"
            label="วันที่สิ้นสุดสัญญา"
            required
            value={toDateValue(formData.rental_end)}
            onChange={(date) => form.setField("rental_end", toISODateString(date))}
            error={formErrors.rental_end}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="เงินประกัน (บาท)"
            type="number"
            step="0.01"
            value={formData.deposit}
            onChange={(event) => form.setField("deposit", event.target.value)}
          />
          <TextField
            label="ค่าเช่าต่อเดือน (บาท)"
            required
            error={formErrors.monthly_rent}
            type="number"
            step="0.01"
            value={formData.monthly_rent}
            onChange={(event) => form.setField("monthly_rent", event.target.value)}
          />
        </div>

        <FormActions onCancel={form.resetForm} isSubmitting={form.isSaving} />
      </form>
    </Modal>
  )
}
