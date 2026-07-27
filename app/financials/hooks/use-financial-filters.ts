"use client"

import { useMemo, useState } from "react"
import type { ExpenseRecord, IncomeRecord } from "@/lib/supabase"

/** ตัวกรองร่วม (คอนโด/ปี/เดือน) + ตัวกรองหมวดหมู่แยกตามตาราง + ยอดรวม */
export function useFinancialFilters(incomeRecords: IncomeRecord[], expenseRecords: ExpenseRecord[]) {
  const currentYear = new Date().getFullYear()

  const [selectedCondoFilter, setSelectedCondoFilter] = useState("")
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedIncomeCategory, setSelectedIncomeCategory] = useState("")
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState("")

  const matchesShared = (record: IncomeRecord | ExpenseRecord) => {
    const recordDate = new Date(record.date)
    const yearMatch = selectedYear === "" || recordDate.getFullYear().toString() === selectedYear
    const monthMatch = selectedMonth === "" || (recordDate.getMonth() + 1).toString() === selectedMonth
    const condoMatch = !selectedCondoFilter || record.condo_id === selectedCondoFilter
    return yearMatch && monthMatch && condoMatch
  }

  const filteredIncomeRecords = useMemo(
    () =>
      incomeRecords.filter(
        (r) => matchesShared(r) && (!selectedIncomeCategory || r.category === selectedIncomeCategory),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [incomeRecords, selectedCondoFilter, selectedYear, selectedMonth, selectedIncomeCategory],
  )

  const filteredExpenseRecords = useMemo(
    () =>
      expenseRecords.filter(
        (r) => matchesShared(r) && (!selectedExpenseCategory || r.category === selectedExpenseCategory),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenseRecords, selectedCondoFilter, selectedYear, selectedMonth, selectedExpenseCategory],
  )

  const totalIncome = filteredIncomeRecords.reduce((sum, record) => sum + record.amount, 0)
  const totalExpenses = filteredExpenseRecords.reduce((sum, record) => sum + record.amount, 0)

  /** ปีที่มีข้อมูลจริง (กรองปี พ.ศ. ที่เคยถูกบันทึกผิดออก) */
  const yearOptions = useMemo(() => {
    const validYears = [...incomeRecords, ...expenseRecords]
      .map((r) => new Date(r.date).getFullYear())
      .filter((year) => year >= 2000 && year <= currentYear + 1)

    if (validYears.length === 0) return [currentYear]

    const minYear = Math.min(...validYears)
    const maxYear = Math.max(currentYear, ...validYears)

    const yearRange: number[] = []
    for (let year = maxYear; year >= minYear; year--) yearRange.push(year)
    return yearRange
  }, [incomeRecords, expenseRecords, currentYear])

  return {
    selectedCondoFilter,
    setSelectedCondoFilter,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedIncomeCategory,
    setSelectedIncomeCategory,
    selectedExpenseCategory,
    setSelectedExpenseCategory,
    filteredIncomeRecords,
    filteredExpenseRecords,
    totalIncome,
    totalExpenses,
    netIncome: totalIncome - totalExpenses,
    yearOptions,
  }
}
