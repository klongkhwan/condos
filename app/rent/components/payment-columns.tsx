"use client"

import { AlertTriangle, Check, Clock, Edit, X } from "lucide-react"
import type { RentPayment } from "@/lib/supabase"
import { daysUntil, formatShortDateTH } from "@/lib/date-utils"
import { NEAR_DUE_DAYS, PAYMENT_STATUS_STYLE, type PaymentStatus } from "../constants"

const STATUS_ICON: Record<PaymentStatus, typeof Check> = {
  paid: Check,
  overdue: AlertTriangle,
  unpaid: Clock,
}

const STATUS_TEXT: Record<PaymentStatus, string> = {
  paid: "ชำระแล้ว",
  overdue: "เกินกำหนด",
  unpaid: "ยังไม่ชำระ",
}

/** สีของวันครบกำหนด — แดงเมื่อเลยกำหนด เหลืองเมื่อใกล้ครบ (เฉพาะรายการที่ยังไม่ชำระ) */
function dueDateClass(payment: RentPayment) {
  if (payment.status === "paid") return ""
  if (new Date(payment.due_date) < new Date()) return "text-destructive"

  const daysRemaining = daysUntil(payment.due_date)
  if (daysRemaining <= NEAR_DUE_DAYS && daysRemaining > 0) return "text-warning"
  return ""
}

export function buildPaymentColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (payment: RentPayment) => void
  onDelete: (payment: RentPayment) => void
}) {
  return [
    {
      key: "tenant_id",
      header: "ผู้เช่า",
      render: (payment: RentPayment) => {
        const condo = payment.tenant?.condo
        return (
          <div>
            <div className="font-medium">{payment.tenant?.full_name || "ไม่ทราบ"}</div>
            <div className="text-sm text-muted-foreground">
              {condo ? `${condo.name} (${condo.room_number})` : "ไม่ทราบคอนโด"}
            </div>
          </div>
        )
      },
    },
    {
      key: "amount",
      header: "จำนวนเงิน",
      render: (payment: RentPayment) => `฿${payment.amount.toLocaleString()}`,
    },
    {
      key: "due_date",
      header: "วันครบกำหนด",
      render: (payment: RentPayment) => (
        <div className={dueDateClass(payment)}>{formatShortDateTH(payment.due_date)}</div>
      ),
    },
    {
      key: "paid_date",
      header: "วันที่ชำระ",
      render: (payment: RentPayment) => (payment.paid_date ? formatShortDateTH(payment.paid_date) : "-"),
    },
    {
      key: "notes",
      header: "หมายเหตุ",
      render: (payment: RentPayment) => payment.notes || "-",
    },
    {
      key: "status",
      header: "สถานะ",
      render: (payment: RentPayment) => {
        const Icon = STATUS_ICON[payment.status]
        return (
          <div className="flex items-center">
            <span
              className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${PAYMENT_STATUS_STYLE[payment.status]}`}
            >
              <Icon className="h-4 w-4" />
              <span className="ml-1">{STATUS_TEXT[payment.status]}</span>
            </span>
          </div>
        )
      },
    },
    {
      key: "actions",
      header: "การดำเนินการ",
      render: (payment: RentPayment) => (
        <div className="flex space-x-2">
          <button onClick={() => onEdit(payment)} className="text-info hover:text-info" title="แก้ไข">
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(payment)}
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
