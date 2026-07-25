"use client"

import { useState, useMemo } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { useAuth } from "@/lib/auth-context"
import { useCondos, useRentPayments, useFinancialRecords, useTenants } from "@/lib/hooks/use-queries"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { Filter, DollarSign, TrendingUp, TrendingDown, Wallet, BarChart3, FileText, PieChart as PieChartIcon } from "lucide-react"
import { MetricCard } from "@/components/ui/metric-card"
import { PageHeader } from "@/components/ui/page-header"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { CategoryDonut } from "@/components/ui/category-donut"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartEmpty,
  ChartGradient,
  ChartLegend,
  ChartSkeleton,
  ChartTooltip,
  axisProps,
  formatBaht,
  formatCompactBaht,
  gridProps,
  useChartTheme,
} from "@/lib/chart-theme"

// Static data hoisted outside component to prevent recreation on every render
// See: Vercel Best Practices - rendering-hoist-jsx
const MONTH_OPTIONS_REPORT = [
  { value: "01", label: "มกราคม" },
  { value: "02", label: "กุมภาพันธ์" },
  { value: "03", label: "มีนาคม" },
  { value: "04", label: "เมษายน" },
  { value: "05", label: "พฤษภาคม" },
  { value: "06", label: "มิถุนายน" },
  { value: "07", label: "กรกฎาคม" },
  { value: "08", label: "สิงหาคม" },
  { value: "09", label: "กันยายน" },
  { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" },
  { value: "12", label: "ธันวาคม" },
];

export default function ReportsPage() {
  const { user } = useAuth()
  const chart = useChartTheme()
  const { incomeRecords, expenseRecords, loading: financialsLoading } = useFinancialRecords(user?.id)
  const { payments, loading: paymentsLoading } = useRentPayments(user?.id)
  const { condos, loading: condosLoading } = useCondos(user?.id)
  const { tenants, loading: tenantsLoading } = useTenants(user?.id)

  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState<string>("all") // New state for month filter
  const [selectedCondoFilter, setSelectedCondoFilter] = useState<string>("all")


  // Memoized filtered financial records based on year, month, and condo
  const filteredFinancialRecords = useMemo(() => {
    return {
      income: incomeRecords.filter((record) => {
        const recordDate = new Date(record.date)
        const recordYear = recordDate.getFullYear().toString()
        const recordMonth = (recordDate.getMonth() + 1).toString().padStart(2, "0") // Ensure 2 digits
        const yearMatch = selectedYear === "all" || recordYear === selectedYear
        const monthMatch = selectedMonth === "all" || recordMonth === selectedMonth
        const condoMatch = selectedCondoFilter === "all" || record.condo_id === selectedCondoFilter
        return yearMatch && monthMatch && condoMatch
      }),
      expense: expenseRecords.filter((record) => {
        const recordDate = new Date(record.date)
        const recordYear = recordDate.getFullYear().toString()
        const recordMonth = (recordDate.getMonth() + 1).toString().padStart(2, "0") // Ensure 2 digits
        const yearMatch = selectedYear === "all" || recordYear === selectedYear
        const monthMatch = selectedMonth === "all" || recordMonth === selectedMonth
        const condoMatch = selectedCondoFilter === "all" || record.condo_id === selectedCondoFilter
        return yearMatch && monthMatch && condoMatch
      }),
    }
  }, [incomeRecords, expenseRecords, selectedYear, selectedMonth, selectedCondoFilter])

  // Memoized filtered payments based on year, month, and condo
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const paymentDate = new Date(p.due_date)
      const paymentYear = paymentDate.getFullYear().toString()
      const paymentMonth = (paymentDate.getMonth() + 1).toString().padStart(2, "0") // Ensure 2 digits
      const yearMatch = selectedYear === "all" || paymentYear === selectedYear
      const monthMatch = selectedMonth === "all" || paymentMonth === selectedMonth
      const condoMatch = selectedCondoFilter === "all" || p.tenant?.condo_id === selectedCondoFilter
      return yearMatch && monthMatch && condoMatch
    })
  }, [payments, selectedYear, selectedMonth, selectedCondoFilter])

  // Monthly Financial Data for Bar Chart
  const monthlyFinancialData = useMemo(() => {
    const dataMap = new Map<string, { name: string; income: number; expense: number }>()

    // Use current year for month labels when "all" is selected
    const yearForLabels = selectedYear === "all" ? new Date().getFullYear() : Number.parseInt(selectedYear)

    // Initialize dataMap with all months for the selected year
    for (let i = 0; i < 12; i++) {
      const monthValue = (i + 1).toString().padStart(2, "0")
      const monthName = format(new Date(yearForLabels, i, 1), "MMM", { locale: th })
      dataMap.set(monthValue, { name: monthName, income: 0, expense: 0 })
    }

    // Populate data for income
    filteredFinancialRecords.income.forEach((record) => {
      const monthValue = (new Date(record.date).getMonth() + 1).toString().padStart(2, "0")
      const currentMonthData = dataMap.get(monthValue)
      if (currentMonthData) {
        currentMonthData.income += record.amount
      }
    })

    // Populate data for expenses
    filteredFinancialRecords.expense.forEach((record) => {
      const monthValue = (new Date(record.date).getMonth() + 1).toString().padStart(2, "0")
      const currentMonthData = dataMap.get(monthValue)
      if (currentMonthData) {
        currentMonthData.expense += record.amount
      }
    })

    // Convert map to array and sort by month number
    return Array.from(dataMap.entries())
      .sort(([monthA], [monthB]) => Number.parseInt(monthA) - Number.parseInt(monthB))
      .map(([, value]) => ({ ...value, net: value.income - value.expense }))
  }, [filteredFinancialRecords.income, filteredFinancialRecords.expense, selectedYear])

  // Payment Status Data for Pie Chart
  const paymentStatusData = useMemo(() => {
    const statusCounts = {
      paid: 0,
      unpaid: 0,
      overdue: 0,
    }

    filteredPayments.forEach((payment) => {
      statusCounts[payment.status]++
    })

    return [
      { name: "ชำระแล้ว", value: statusCounts.paid, color: chart["chart-2"] },
      { name: "ยังไม่ชำระ", value: statusCounts.unpaid, color: chart["chart-4"] },
      { name: "เกินกำหนด", value: statusCounts.overdue, color: chart["chart-3"] },
    ].filter((item) => item.value > 0) // กรองรายการที่มีค่า 0 ออก
  }, [filteredPayments, chart])

  // Income by Category Data for Pie Chart
  const incomeByCategoryData = useMemo(() => {
    const categoryMap = new Map<string, number>()
    filteredFinancialRecords.income.forEach((record) => {
      const category = record.category || "ไม่ระบุ"
      categoryMap.set(category, (categoryMap.get(category) || 0) + record.amount)
    })
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))
  }, [filteredFinancialRecords.income])

  // Expense by Category Data for Pie Chart
  const expenseByCategoryData = useMemo(() => {
    const categoryMap = new Map<string, number>()
    filteredFinancialRecords.expense.forEach((record) => {
      const category = record.category || "ไม่ระบุ"
      categoryMap.set(category, (categoryMap.get(category) || 0) + record.amount)
    })
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))
  }, [filteredFinancialRecords.expense])

  // Available Years for filter - always include current year, filter out invalid years (e.g., Buddhist Era stored incorrectly)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years = new Set<number>()
    // Always add current year so it's selectable even if no data exists
    years.add(currentYear)
    
    // Helper to add year only if valid (CE years between 2000 and currentYear + 1)
    const addIfValid = (year: number) => {
      if (year >= 2000 && year <= currentYear + 1) {
        years.add(year)
      }
    }
    
    incomeRecords.forEach((r) => addIfValid(new Date(r.date).getFullYear()))
    expenseRecords.forEach((r) => addIfValid(new Date(r.date).getFullYear()))
    payments.forEach((p) => addIfValid(new Date(p.due_date).getFullYear()))
    return Array.from(years).sort((a, b) => b - a)
  }, [incomeRecords, expenseRecords, payments])

  // Financial Summary
  const totalIncome = filteredFinancialRecords.income.reduce((sum, record) => sum + record.amount, 0)
  const totalExpenses = filteredFinancialRecords.expense.reduce((sum, record) => sum + record.amount, 0)
  const netIncome = totalIncome - totalExpenses

  // Installment vs Rent Analysis - เงินออกเพิ่มต่อเดือน
  const installmentAnalysis = useMemo(() => {
    return condos.map((condo) => {
      const activeTenant = tenants.find(
        (t) => t.condo_id === condo.id && t.is_active
      );
      const installment = condo.installment_amount || 0;
      const rent = activeTenant?.monthly_rent || 0;
      const difference = installment - rent;
      
      return {
        condoId: condo.id,
        condoName: condo.name,
        roomNumber: condo.room_number,
        installment,
        rent,
        difference,
        hasTenant: !!activeTenant,
        tenantName: activeTenant?.full_name || "-",
      };
    });
  }, [condos, tenants]);

  // Summary totals
  const totalInstallment = installmentAnalysis.reduce((sum, item) => sum + item.installment, 0);
  const totalRent = installmentAnalysis.reduce((sum, item) => sum + item.rent, 0);
  const totalDifference = totalInstallment - totalRent;

  const hasMonthlyData = monthlyFinancialData.some((m) => m.income > 0 || m.expense > 0)
  const periodLabel = `${selectedYear === "all" ? "ทุกปี" : Number.parseInt(selectedYear) + 543}${
    selectedMonth !== "all" ? ` · ${MONTH_OPTIONS_REPORT.find((m) => m.value === selectedMonth)?.label}` : ""
  }`

  return (
    <MainLayout>
      <div className="space-y-5 sm:space-y-6">
        <PageHeader
          title="รายงานและสถิติ"
          description="ภาพรวมการเงินและสถานะการชำระค่าเช่า"
          icon={FileText}
        />

        {/* Tabs for different report sections */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card p-1 border border-input rounded-lg mb-4 sm:mb-6">
            <TabsTrigger 
              value="overview"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="h-4 w-4" />
              ภาพรวม
            </TabsTrigger>
            <TabsTrigger 
              value="analysis"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Wallet className="h-4 w-4" />
              วิเคราะห์
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Filters - inside Overview tab */}
            <div className="bg-card rounded-lg border border-border p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-4">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hidden sm:block" />
              <div className="flex items-center gap-1 sm:gap-2">
                <label className="text-xs sm:text-sm font-medium text-foreground" htmlFor="reports-f1">ปี:</label>
                <select id="reports-f1"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-2 py-1 sm:px-3 bg-muted border border-input rounded text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">ทุกปี</option>
                  {availableYears.length > 0 ? (
                    availableYears.map((year) => (
                      <option key={year} value={year.toString()}>
                        {year + 543}
                      </option>
                    ))
                  ) : (
                    <option value={new Date().getFullYear().toString()}>{new Date().getFullYear() + 543}</option>
                  )}
                </select>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <label className="text-xs sm:text-sm font-medium text-foreground" htmlFor="reports-f2">เดือน:</label>
                <select id="reports-f2"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2 py-1 sm:px-3 bg-muted border border-input rounded text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">ทั้งหมด</option>
                  {MONTH_OPTIONS_REPORT.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <label className="text-xs sm:text-sm font-medium text-foreground" htmlFor="reports-f3">คอนโด:</label>
                <select id="reports-f3"
                  value={selectedCondoFilter}
                  onChange={(e) => setSelectedCondoFilter(e.target.value)}
                  className="px-2 py-1 sm:px-3 bg-muted border border-input rounded text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring max-w-[100px] sm:max-w-none"
                >
                  <option value="all">ทั้งหมด</option>
                  {condos.map((condo) => (
                    <option key={condo.id} value={condo.id}>
                      {condo.name} ({condo.room_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <MetricCard
                label="รายรับรวม"
                value={formatBaht(totalIncome)}
                caption={periodLabel}
                icon={TrendingUp}
                tone="info"
                loading={financialsLoading}
              />
              <MetricCard
                label="รายจ่ายรวม"
                value={formatBaht(totalExpenses)}
                caption={periodLabel}
                icon={TrendingDown}
                tone="warning"
                loading={financialsLoading}
              />
              <MetricCard
                label="กำไรสุทธิ"
                value={formatBaht(netIncome)}
                caption={totalIncome > 0 ? `อัตรากำไร ${Math.round((netIncome / totalIncome) * 100)}%` : periodLabel}
                icon={DollarSign}
                tone={netIncome >= 0 ? "success" : "danger"}
                spark={monthlyFinancialData.map((m) => m.net)}
                loading={financialsLoading}
              />
            </div>

            {/* Monthly Financial Chart */}
            <Panel>
              <PanelHeader
                title="รายรับและรายจ่ายรายเดือน"
                description={periodLabel}
                icon={BarChart3}
                actions={
                  <ChartLegend
                    items={[
                      { label: "รายรับ", color: chart["chart-1"], variant: "line" },
                      { label: "รายจ่าย", color: chart["chart-3"], variant: "dashed" },
                    ]}
                  />
                }
              />
              {financialsLoading ? (
                <ChartSkeleton height={280} />
              ) : !hasMonthlyData ? (
                <ChartEmpty height={280} message="ไม่พบข้อมูลสำหรับตัวกรองที่เลือก" />
              ) : (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {/*
                      12 เดือนใช้เส้นแทนแท่ง — แท่งคู่ 24 แท่งจะบางจนอ่านไม่ออก
                      ระยะห่างระหว่างสองเส้นคือกำไรสุทธิ พื้นที่ใต้เส้นรายรับช่วยให้แยกชั้นได้
                    */}
                    <AreaChart data={monthlyFinancialData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <defs>
                        <ChartGradient id="reportIncome" color={chart["chart-1"]} from={0.22} to={0} />
                      </defs>
                      <CartesianGrid {...gridProps(chart)} />
                      <XAxis
                        dataKey="name"
                        {...axisProps(chart)}
                        dy={6}
                        interval={0}
                        tick={{ fill: chart["muted-foreground"], fontSize: 11 }}
                      />
                      <YAxis {...axisProps(chart)} tickFormatter={(v: number) => formatCompactBaht(v)} width={56} />
                      <RechartsTooltip
                        cursor={{ stroke: chart["chart-grid"], strokeWidth: 1 }}
                        content={<ChartTooltip />}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        name="รายรับ"
                        stroke={chart["chart-1"]}
                        strokeWidth={2}
                        fill="url(#reportIncome)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: chart["chart-1"] }}
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        name="รายจ่าย"
                        stroke={chart["chart-3"]}
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        fill="none"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: chart["chart-3"] }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            {/* Income and Expense by Category */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel>
                <PanelHeader title="รายรับตามหมวดหมู่" description={periodLabel} icon={TrendingUp} />
                {financialsLoading ? (
                  <ChartSkeleton height={220} />
                ) : (
                  <CategoryDonut
                    data={incomeByCategoryData}
                    centerLabel="รายรับรวม"
                    emptyMessage="ไม่พบข้อมูลรายรับสำหรับตัวกรองที่เลือก"
                    height={200}
                  />
                )}
              </Panel>

              <Panel>
                <PanelHeader title="รายจ่ายตามหมวดหมู่" description={periodLabel} icon={TrendingDown} />
                {financialsLoading ? (
                  <ChartSkeleton height={220} />
                ) : (
                  <CategoryDonut
                    data={expenseByCategoryData}
                    centerLabel="รายจ่ายรวม"
                    emptyMessage="ไม่พบข้อมูลรายจ่ายสำหรับตัวกรองที่เลือก"
                    height={200}
                  />
                )}
              </Panel>
            </div>

            {/* Payment Status */}
            <Panel>
              <PanelHeader title="สถานะการชำระค่าเช่า" description={periodLabel} icon={PieChartIcon} />
              {paymentsLoading ? (
                <ChartSkeleton height={220} />
              ) : (
                <CategoryDonut
                  data={paymentStatusData}
                  centerLabel="ทั้งหมด"
                  formatValue={(value) => `${Math.round(value).toLocaleString("th-TH")} รายการ`}
                  emptyMessage="ไม่พบข้อมูลการชำระค่าเช่าสำหรับตัวกรองที่เลือก"
                  height={200}
                />
              )}
            </Panel>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4 sm:space-y-6">
            {/* Installment vs Rent Analysis */}
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <h2 className="text-base sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                <span className="hidden sm:inline">วิเคราะห์เงินออกเพิ่มต่อเดือน (ยอดผ่อน - ค่าเช่า)</span>
                <span className="sm:hidden">เงินออกเพิ่ม/เดือน</span>
              </h2>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-muted rounded-lg p-3 sm:p-4 border border-input">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1">ยอดผ่อนรวม/เดือน</div>
                  <div className="text-lg sm:text-xl font-bold text-foreground">฿{totalInstallment.toLocaleString()}</div>
                </div>
                <div className="bg-muted rounded-lg p-3 sm:p-4 border border-input">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1">ค่าเช่ารวม/เดือน</div>
                  <div className="text-lg sm:text-xl font-bold text-success">฿{totalRent.toLocaleString()}</div>
                </div>
                <div className={`rounded-lg p-3 sm:p-4 border ${totalDifference > 0 ? 'bg-destructive-muted border-destructive/40' : 'bg-success-muted border-primary/40'}`}>
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1">เงินออกเพิ่มรวม/เดือน</div>
                  <div className={`text-lg sm:text-xl font-bold ${totalDifference > 0 ? 'text-destructive' : 'text-success'}`}>
                    {totalDifference > 0 ? '+' : ''}฿{totalDifference.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Analysis Table */}
              {condosLoading || tenantsLoading ? (
                <div className="text-muted-foreground text-center py-10">กำลังโหลดข้อมูล...</div>
              ) : installmentAnalysis.length === 0 ? (
                <div className="text-muted-foreground text-center py-10">ไม่พบข้อมูลคอนโด</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">คอนโด</th>
                        <th className="px-4 py-3 text-left">ผู้เช่า</th>
                        <th className="px-4 py-3 text-right">ยอดผ่อน/เดือน</th>
                        <th className="px-4 py-3 text-right">ค่าเช่า/เดือน</th>
                        <th className="px-4 py-3 text-right">เงินออกเพิ่ม/เดือน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {installmentAnalysis.map((item) => (
                        <tr key={item.condoId} className="hover:bg-accent/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{item.condoName}</div>
                            <div className="text-xs text-muted-foreground">ห้อง {item.roomNumber}</div>
                          </td>
                          <td className="px-4 py-3">
                            {item.hasTenant ? (
                              <span className="text-success">{item.tenantName}</span>
                            ) : (
                              <span className="text-warning">ว่าง</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground">
                            ฿{item.installment.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {item.hasTenant ? (
                              <span className="text-success">฿{item.rent.toLocaleString()}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-medium ${item.difference > 0 ? 'text-destructive' : item.difference < 0 ? 'text-success' : 'text-muted-foreground'}`}>
                              {item.difference > 0 ? '+' : ''}{item.difference === 0 ? '-' : `฿${item.difference.toLocaleString()}`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Note */}
              <div className="mt-4 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                <strong>หมายเหตุ:</strong> แสดงเฉพาะผู้เช่าที่กำลังเช่าอยู่ (Active) • 
                <span className="text-destructive">สีแดง</span> = ต้องออกเงินเพิ่ม • 
                <span className="text-success">สีเขียว</span> = มีกำไร/เหลือเก็บ
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
