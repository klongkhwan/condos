export const MONTHS_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
]

export const PAYMENT_DOCUMENT_TYPES = [
  { value: "payment_receipt", label: "ใบเสร็จการชำระ" },
  { value: "bank_slip", label: "สลิปโอนเงิน" },
  { value: "proof", label: "หลักฐานการชำระ" },
  { value: "other", label: "อื่นๆ" },
]

export type PaymentStatus = "unpaid" | "paid" | "overdue"

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "unpaid", label: "ยังไม่ชำระ" },
  { value: "paid", label: "ชำระแล้ว" },
  { value: "overdue", label: "เกินกำหนด" },
]

export const PAYMENT_STATUS_STYLE: Record<PaymentStatus, string> = {
  paid: "bg-success-muted text-success",
  overdue: "bg-destructive-muted text-destructive",
  unpaid: "bg-warning-muted text-warning",
}

export type PaymentStatusFilter = "all" | PaymentStatus

/** จำนวนวันก่อนครบกำหนดที่ถือว่า "ใกล้ครบกำหนด" */
export const NEAR_DUE_DAYS = 7
