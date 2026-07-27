"use client"

import { Edit, FileText, X } from "lucide-react"
import type { Condo, ExpenseRecord, IncomeRecord } from "@/lib/supabase"
import { formatShortDateTH } from "@/lib/date-utils"
import type { RecordType } from "../constants"

type FinancialRecord = IncomeRecord | ExpenseRecord

/** คอลัมน์ของตารางรายรับ/รายจ่าย — ต่างกันแค่สีของจำนวนเงินและ type ที่ส่งกลับไปยัง handler */
export function buildRecordColumns({
  type,
  condos,
  onEdit,
  onAttach,
  onDelete,
}: {
  type: RecordType
  condos: Condo[]
  onEdit: (record: FinancialRecord, type: RecordType) => void
  onAttach: (record: FinancialRecord, type: RecordType) => void
  onDelete: (id: string, type: RecordType, name: string) => void
}) {
  const amountClass = type === "income" ? "text-success" : "text-destructive"

  return [
    {
      key: "date",
      header: "วันที่",
      render: (record: FinancialRecord) => {
        const condo = condos.find((c) => c.id === record.condo_id)
        return (
          <div>
            <div className="font-medium">{formatShortDateTH(record.date)}</div>
            <div className="text-sm text-muted-foreground">
              {condo ? `${condo.name} (${condo.room_number})` : "ไม่ทราบคอนโด"}
            </div>
          </div>
        )
      },
    },
    { key: "type", header: "หัวข้อ" },
    {
      key: "amount",
      header: "จำนวนเงิน",
      render: (record: FinancialRecord) => (
        <span className={`${amountClass} font-medium`}>฿{record.amount.toLocaleString()}</span>
      ),
    },
    { key: "category", header: "หมวดหมู่" },
    {
      key: "description",
      header: "รายละเอียด",
      render: (record: FinancialRecord) => record.description || "-",
    },
    {
      key: "actions",
      header: "การดำเนินการ",
      render: (record: FinancialRecord) => (
        <div className="flex space-x-2">
          <button onClick={() => onEdit(record, type)} className="text-info hover:text-info" title="แก้ไข">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={() => onAttach(record, type)} className="text-success hover:text-success" title="แนบไฟล์">
            <FileText className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(record.id, type, record.type)}
            className="text-destructive hover:text-destructive"
            title="ลบ"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]
}
