"use client"

import { DataTable } from "@/components/ui/data-table"
import type { Condo, ExpenseRecord, IncomeRecord } from "@/lib/supabase"
import { buildRecordColumns } from "./record-columns"
import type { RecordType } from "../constants"

type FinancialRecord = IncomeRecord | ExpenseRecord

/** หัวข้อ + ตัวกรองหมวดหมู่ + ตาราง สำหรับรายรับหรือรายจ่ายหนึ่งชุด */
export function RecordsSection({
  type,
  title,
  records,
  categories,
  selectedCategory,
  onCategoryChange,
  condos,
  loading,
  emptyMessage,
  tableKey,
  onEdit,
  onAttach,
  onDelete,
}: {
  type: RecordType
  title: string
  records: FinancialRecord[]
  categories: readonly string[]
  selectedCategory: string
  onCategoryChange: (value: string) => void
  condos: Condo[]
  loading: boolean
  emptyMessage: string
  tableKey: string
  onEdit: (record: FinancialRecord, type: RecordType) => void
  onAttach: (record: FinancialRecord, type: RecordType) => void
  onDelete: (id: string, type: RecordType, name: string) => void
}) {
  const selectId = `financials-${type}-category`

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h2>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground" htmlFor={selectId}>
              หมวดหมู่:
            </label>
            <select
              id={selectId}
              value={selectedCategory}
              onChange={(event) => onCategoryChange(event.target.value)}
              className="px-2 py-1 bg-muted border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">ทั้งหมด</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <span className="text-sm text-muted-foreground">{records.length} รายการ</span>
        </div>
      </div>

      <DataTable
        key={tableKey}
        data={records}
        columns={buildRecordColumns({ type, condos, onEdit, onAttach, onDelete })}
        loading={loading}
        emptyMessage={emptyMessage}
        itemsPerPage={5}
      />
    </div>
  )
}
