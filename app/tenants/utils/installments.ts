export type Installment = {
  installmentNo: number
  startDate: Date
  endDate: Date
}

/**
 * แตกสัญญาเช่าเป็นงวดรายเดือน โดยยึดวันที่เริ่มสัญญาเป็นวันตัดรอบ
 * งวดสุดท้ายจบที่วันสิ้นสุดสัญญาจริง
 */
export function calculateInstallments(rentalStart: string, rentalEnd: string): Installment[] {
  const startDate = new Date(rentalStart)
  const endDate = new Date(rentalEnd)

  const totalMonths =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())

  const startDay = startDate.getDate()
  const result: Installment[] = []

  for (let i = 0; i < totalMonths; i++) {
    const periodStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDay)
    const periodEnd =
      i === totalMonths - 1
        ? new Date(endDate)
        : new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, startDay)

    result.push({ installmentNo: i + 1, startDate: periodStart, endDate: periodEnd })
  }

  return result
}
