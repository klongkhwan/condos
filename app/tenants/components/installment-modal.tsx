"use client"

import { useMemo } from "react"
import { Modal } from "@/components/ui/modal"
import type { Tenant } from "@/lib/supabase"
import { formatShortDateTH } from "@/lib/date-utils"
import { calculateInstallments } from "../utils/installments"

/** ตารางงวดการเช่าที่คำนวณจากช่วงสัญญาของผู้เช่า */
export function InstallmentModal({ tenant, onClose }: { tenant: Tenant | null; onClose: () => void }) {
  const installments = useMemo(
    () => (tenant ? calculateInstallments(tenant.rental_start, tenant.rental_end) : []),
    [tenant],
  )

  return (
    <Modal
      isOpen={!!tenant}
      onClose={onClose}
      title={`งวดการเช่า - ${tenant?.full_name || ""}`}
      size="md"
    >
      <div className="space-y-4">
        {tenant && (
          <div className="bg-muted rounded-lg p-3 mb-4">
            <div className="text-sm text-foreground">
              <span className="font-medium">ระยะเวลาสัญญา:</span> {formatShortDateTH(tenant.rental_start)} -{" "}
              {formatShortDateTH(tenant.rental_end)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">รวม {installments.length} งวด</div>
          </div>
        )}

        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-foreground font-medium">งวดที่</th>
                <th className="px-4 py-3 text-left text-foreground font-medium">วันที่ - สิ้นเดือน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {installments.map((installment) => (
                <tr key={installment.installmentNo} className="hover:bg-accent/50">
                  <td className="px-4 py-3 text-foreground font-medium">{installment.installmentNo}</td>
                  <td className="px-4 py-3 text-foreground">
                    {formatShortDateTH(installment.startDate)} - {formatShortDateTH(installment.endDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted hover:bg-accent text-foreground rounded-lg transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </Modal>
  )
}
