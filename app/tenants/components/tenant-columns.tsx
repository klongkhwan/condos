"use client"

import { Edit, FileText, Info, MessageCircle, Phone, UserX } from "lucide-react"
import type { Condo, Tenant } from "@/lib/supabase"
import { daysUntil, formatShortDateTH } from "@/lib/date-utils"
import { EXPIRY_WARNING_DAYS } from "../constants"

/** สีของวันสิ้นสุดสัญญาตามจำนวนวันคงเหลือ */
function rentalEndClass(daysRemaining: number) {
  if (daysRemaining <= 0) return "text-destructive font-bold italic"
  if (daysRemaining <= EXPIRY_WARNING_DAYS.danger) return "text-destructive font-medium"
  if (daysRemaining <= EXPIRY_WARNING_DAYS.warning) return "text-warning"
  return "text-muted-foreground"
}

/** ป้ายสถานะสัญญา */
function contractStatus(tenant: Tenant) {
  const daysRemaining = daysUntil(tenant.rental_end)

  if (!tenant.is_active) return { text: "ไม่ใช้งาน", className: "bg-destructive-muted text-destructive" }
  if (daysRemaining < 0) return { text: "หมดสัญญา", className: "bg-destructive-muted text-destructive" }
  if (daysRemaining <= EXPIRY_WARNING_DAYS.danger)
    return { text: "จะหมดสัญญา", className: "bg-destructive-muted/60 text-destructive" }
  if (daysRemaining <= EXPIRY_WARNING_DAYS.warning)
    return { text: "ใกล้หมดสัญญา", className: "bg-warning-muted text-warning" }
  return { text: "ใช้งาน", className: "bg-success-muted text-success" }
}

export function buildTenantColumns({
  condos,
  onEdit,
  onAttach,
  onEndContract,
  onShowInstallments,
}: {
  condos: Condo[]
  onEdit: (tenant: Tenant) => void
  onAttach: (tenant: Tenant) => void
  onEndContract: (tenant: Tenant) => void
  onShowInstallments: (tenant: Tenant) => void
}) {
  return [
    { key: "full_name", header: "ชื่อผู้เช่า" },
    {
      key: "condo_id",
      header: "คอนโด",
      render: (tenant: Tenant) => {
        const condo = condos.find((c) => c.id === tenant.condo_id)
        return condo ? `${condo.name} (${condo.room_number})` : "ไม่ทราบ"
      },
    },
    {
      key: "phone",
      header: "ติดต่อ",
      render: (tenant: Tenant) => (
        <div className="flex items-center space-x-2">
          {tenant.phone && (
            <div className="flex items-center text-sm">
              <Phone className="h-3 w-3 mr-1" />
              {tenant.phone}
            </div>
          )}
          {tenant.line_id && (
            <div className="flex items-center text-sm">
              <MessageCircle className="h-3 w-3 mr-1" />
              {tenant.line_id}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "monthly_rent",
      header: "ค่าเช่า/เดือน",
      render: (tenant: Tenant) => `฿${tenant.monthly_rent.toLocaleString()}`,
    },
    {
      key: "rental_period",
      header: "ระยะเวลาเช่า",
      render: (tenant: Tenant) => (
        <div className="flex items-center gap-2">
          <div className="text-sm">
            <div>{formatShortDateTH(tenant.rental_start)}</div>
            <div className={rentalEndClass(daysUntil(tenant.rental_end))}>
              ถึง {formatShortDateTH(tenant.rental_end)}
            </div>
          </div>
          <button
            onClick={() => onShowInstallments(tenant)}
            className="p-1 text-info hover:text-info hover:bg-info-muted rounded transition-colors"
            title="ดูงวดการเช่า"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      ),
    },
    {
      key: "status",
      header: "สถานะ",
      render: (tenant: Tenant) => {
        const status = contractStatus(tenant)
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>{status.text}</span>
        )
      },
    },
    {
      key: "actions",
      header: "การดำเนินการ",
      render: (tenant: Tenant) => (
        <div className="flex space-x-2">
          <button onClick={() => onEdit(tenant)} className="text-info hover:text-info" title="แก้ไข">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={() => onAttach(tenant)} className="text-success hover:text-success" title="แนบไฟล์">
            <FileText className="h-4 w-4" />
          </button>
          {tenant.is_active && (
            <button
              onClick={() => onEndContract(tenant)}
              className="text-warning hover:text-warning"
              title="สิ้นสุดสัญญา"
            >
              <UserX className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]
}
