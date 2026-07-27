/**
 * ยูทิลวันที่ที่เคยถูกเขียนซ้ำ inline ในทุกฟอร์ม (financials / tenants / rent / condos)
 */

/** แปลง Date เป็น "YYYY-MM-DD" ตาม timezone ท้องถิ่น (ไม่ใช้ toISOString เพราะจะเลื่อนวัน) */
export function toISODateString(date?: Date | null): string {
  if (!date) return ""
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/** แปลงค่าจากฟอร์ม (string) กลับเป็น Date สำหรับ <DatePicker value> */
export function toDateValue(value?: string | null): Date | undefined {
  return value ? new Date(value) : undefined
}

/** วันที่วันนี้ในรูปแบบ "YYYY-MM-DD" */
export function todayISO(): string {
  return toISODateString(new Date())
}

/**
 * แสดงวันที่แบบไทยย่อ เช่น 25/7/2569
 * (คนละตัวกับ formatThaiDate ใน components/ui/date-picker ที่ให้ "25 กรกฎาคม 2569")
 */
export function formatShortDateTH(value?: string | Date | null): string {
  if (!value) return "-"
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleDateString("th-TH")
}

/** จำนวนวันที่เหลือจนถึง date (ปัดขึ้น) ค่าติดลบ = เลยกำหนดแล้ว */
export function daysUntil(value: string | Date): number {
  const target = value instanceof Date ? value : new Date(value)
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  return Math.ceil((target.getTime() - Date.now()) / MS_PER_DAY)
}
