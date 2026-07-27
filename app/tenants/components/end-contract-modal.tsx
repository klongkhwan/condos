"use client"

import { Modal } from "@/components/ui/modal"
import { SelectField, TextAreaField } from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { FormActions } from "@/components/ui/form-actions"
import { toDateValue, toISODateString } from "@/lib/date-utils"
import { END_REASON_OPTIONS } from "../constants"
import type { useEndContract } from "../hooks/use-end-contract"

type EndContractState = ReturnType<typeof useEndContract>

export function EndContractModal({ state }: { state: EndContractState }) {
  return (
    <Modal isOpen={!!state.tenant} onClose={state.close} title="สิ้นสุดสัญญาเช่า" size="md">
      <form onSubmit={state.handleSubmit} className="space-y-4">
        <div className="bg-warning-muted/20 border border-warning/40 rounded-lg p-4">
          <p className="text-warning text-sm">
            การดำเนินการนี้จะย้ายผู้เช่า "{state.tenant?.full_name}" ไปยังประวัติผู้เช่า
          </p>
        </div>

        <SelectField
          label="สาเหตุการสิ้นสุดสัญญา"
          required
          value={state.data.end_reason}
          onChange={(event) => state.setField("end_reason", event.target.value as typeof state.data.end_reason)}
        >
          {END_REASON_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <DatePicker
          id="actual_end_date"
          label="วันที่ย้ายออกจริง"
          required
          value={toDateValue(state.data.actual_end_date)}
          onChange={(date) => state.setField("actual_end_date", toISODateString(date))}
        />

        <TextAreaField
          label="หมายเหตุ"
          value={state.data.notes}
          onChange={(event) => state.setField("notes", event.target.value)}
          rows={3}
          placeholder="เช่น: ผู้เช่าย้ายงาน, ไม่พอใจบริการ, เปลี่ยนเป็นผู้เช่าใหม่ ฯลฯ"
        />

        <FormActions
          onCancel={state.close}
          isSubmitting={state.isSubmitting}
          loadingLabel="กำลังดำเนินการ..."
        />
      </form>
    </Modal>
  )
}
