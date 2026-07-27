export const DOCUMENT_TYPES = [
  { value: "receipt", label: "ใบเสร็จ" },
  { value: "invoice", label: "ใบแจ้งหนี้" },
  { value: "bank_statement", label: "รายการเดินบัญชี" },
  { value: "other", label: "อื่นๆ" },
]

export const MONTH_OPTIONS = [
  { value: "1", label: "มกราคม" },
  { value: "2", label: "กุมภาพันธ์" },
  { value: "3", label: "มีนาคม" },
  { value: "4", label: "เมษายน" },
  { value: "5", label: "พฤษภาคม" },
  { value: "6", label: "มิถุนายน" },
  { value: "7", label: "กรกฎาคม" },
  { value: "8", label: "สิงหาคม" },
  { value: "9", label: "กันยายน" },
  { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" },
  { value: "12", label: "ธันวาคม" },
] as const

export const INCOME_CATEGORIES = [
  "ค่าเช่า",
  "ค่าที่จอดรถ",
  "ค่าประกันห้อง",
  "ค่าส่วนกลาง",
  "ค่าปรับ",
  "อื่นๆ",
] as const

export const EXPENSE_CATEGORIES = [
  "ค่าบำรุงรักษา",
  "ค่าส่วนกลาง",
  "ค่าตกแต่งห้อง",
  "ค่าน้ำ/ไฟ",
  "ค่าประกันห้อง",
  "ค่าประกันภัย",
  "ค่านายหน้า",
  "ค่าภาษี",
  "อื่นๆ",
] as const

export type RecordType = "income" | "expense"
