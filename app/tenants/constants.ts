export const TENANT_DOCUMENT_TYPES = [
  { value: "id_card", label: "สำเนาบัตรประชาชน" },
  { value: "rental_agreement", label: "สัญญาเช่า" },
  { value: "bank_account", label: "สำเนาบัญชีธนาคาร" },
  { value: "other", label: "อื่นๆ" },
]

export const END_REASON_OPTIONS = [
  { value: "expired", label: "หมดอายุสัญญา" },
  { value: "early_termination", label: "ยกเลิกก่อนกำหนด" },
  { value: "changed_tenant", label: "เปลี่ยนผู้เช่า" },
] as const

/** เกณฑ์เตือนวันหมดสัญญา (วัน) */
export const EXPIRY_WARNING_DAYS = {
  danger: 60,
  warning: 90,
} as const

export type StatusFilter = "all" | "active" | "vacant"
