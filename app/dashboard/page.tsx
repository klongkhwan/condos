"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  CalendarClock,
  Clock,
  DoorOpen,
  LayoutDashboard,
  Percent,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { addDays, differenceInDays, format } from "date-fns"
import { th } from "date-fns/locale"
import { useQueryClient } from "@tanstack/react-query"

import { MainLayout } from "@/components/layout/main-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { MetricCard } from "@/components/ui/metric-card"
import { DataTable } from "@/components/ui/data-table"
import { PaymentStatusBadge } from "@/components/ui/status-badge"
import { useAuth } from "@/lib/auth-context"
import { useCondos, useFinancialRecords, useRentPayments, useTenants } from "@/lib/hooks/use-queries"
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
import { cn } from "@/lib/utils"

type PaymentTab = "outstanding" | "paid"

export default function DashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const chart = useChartTheme()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [paymentTab, setPaymentTab] = useState<PaymentTab>("outstanding")

  const { condos, loading: condosLoading } = useCondos(user?.id)
  const { tenants, loading: tenantsLoading } = useTenants(user?.id)
  const { payments, loading: paymentsLoading } = useRentPayments(user?.id)
  const { incomeRecords, expenseRecords, loading: financialsLoading } = useFinancialRecords(user?.id)

  const isLoading = condosLoading || tenantsLoading || paymentsLoading || financialsLoading

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await queryClient.invalidateQueries()
    setTimeout(() => setIsRefreshing(false), 800)
  }

  const totalCondos = condos.length
  const activeTenants = tenants.filter((t) => t.is_active).length
  const vacantRooms = Math.max(0, totalCondos - activeTenants)
  const occupancyRate = totalCondos > 0 ? Math.round((activeTenants / totalCondos) * 100) : 0

  const unpaidPayments = payments.filter((p) => p.status === "unpaid")
  const overduePayments = payments.filter((p) => p.status === "overdue")
  const paidPayments = payments.filter((p) => p.status === "paid")

  const totalUnpaidAmount = unpaidPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalOverdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0)

  // ข้อมูลรายเดือน 6 เดือนล่าสุด ใช้ทั้งกราฟ sparkline และการคำนวณอัตราเติบโต
  const monthlyData = useMemo(() => {
    const now = new Date()
    const buckets: { name: string; income: number; expense: number; net: number }[] = []

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth()

      const inMonth = (value: string) => {
        const d = new Date(value)
        return d.getFullYear() === year && d.getMonth() === month
      }

      const income = incomeRecords.filter((r) => inMonth(r.date)).reduce((sum, r) => sum + r.amount, 0)
      const expense = expenseRecords.filter((r) => inMonth(r.date)).reduce((sum, r) => sum + r.amount, 0)

      buckets.push({
        name: format(date, "MMM", { locale: th }),
        income,
        expense,
        net: income - expense,
      })
    }

    return buckets
  }, [incomeRecords, expenseRecords])

  const currentMonth = monthlyData[monthlyData.length - 1]
  const previousMonth = monthlyData[monthlyData.length - 2]

  const netDelta = useMemo(() => {
    if (!currentMonth || !previousMonth || previousMonth.net === 0) return undefined
    return ((currentMonth.net - previousMonth.net) / Math.abs(previousMonth.net)) * 100
  }, [currentMonth, previousMonth])

  const incomeDelta = useMemo(() => {
    if (!currentMonth || !previousMonth || previousMonth.income === 0) return undefined
    return ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100
  }, [currentMonth, previousMonth])

  const hasChartData = monthlyData.some((m) => m.income > 0 || m.expense > 0)

  const statusBreakdown = useMemo(() => {
    const rows = [
      { key: "paid", label: "ชำระแล้ว", count: paidPayments.length, color: chart["chart-2"] },
      { key: "unpaid", label: "ยังไม่ชำระ", count: unpaidPayments.length, color: chart["chart-4"] },
      { key: "overdue", label: "เกินกำหนด", count: overduePayments.length, color: chart["chart-3"] },
    ]
    const total = rows.reduce((sum, r) => sum + r.count, 0)
    return { rows, total }
  }, [paidPayments.length, unpaidPayments.length, overduePayments.length, chart])

  const upcomingPayments = useMemo(() => {
    const today = new Date()
    const horizon = addDays(today, 7)

    return payments
      .filter((p) => {
        if (p.status === "paid") return false
        const dueDate = new Date(p.due_date)
        return dueDate >= today && dueDate <= horizon
      })
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 6)
  }, [payments])

  const outstandingRows = useMemo(
    () =>
      payments
        .filter((p) => p.status === "unpaid" || p.status === "overdue")
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()),
    [payments],
  )

  const paidRows = useMemo(
    () =>
      payments
        .filter((p) => p.status === "paid")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [payments],
  )

  const paymentColumns = [
    {
      key: "tenant_id",
      header: "ผู้เช่า",
      render: (payment: any) => {
        const tenant = payment.tenant
        const condo = tenant?.condo
        return (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{tenant?.full_name || "ไม่ทราบ"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {condo ? `${condo.name} · ${condo.room_number}` : "ไม่ทราบคอนโด"}
            </p>
          </div>
        )
      },
    },
    {
      key: "amount",
      header: "จำนวนเงิน",
      align: "right" as const,
      render: (payment: any) => <span className="font-medium">{formatBaht(payment.amount)}</span>,
    },
    {
      key: "due_date",
      header: "ครบกำหนด",
      render: (payment: any) => (
        <span className="text-muted-foreground">
          {format(new Date(payment.due_date), "d MMM yy", { locale: th })}
        </span>
      ),
    },
    {
      key: "paid_date",
      header: "วันที่ชำระ",
      hideOnMobile: true,
      render: (payment: any) => (
        <span className="text-muted-foreground">
          {payment.paid_date ? format(new Date(payment.paid_date), "d MMM yy", { locale: th }) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "สถานะ",
      render: (payment: any) => <PaymentStatusBadge status={payment.status} />,
    },
    {
      key: "notes",
      header: "หมายเหตุ",
      hideOnMobile: true,
      render: (payment: any) => (
        <span className="text-muted-foreground">{payment.notes || "—"}</span>
      ),
    },
  ]

  const activeRows = paymentTab === "outstanding" ? outstandingRows : paidRows

  return (
    <MainLayout>
      <div className="space-y-5 sm:space-y-6">
        <PageHeader
          title="แดชบอร์ด"
          description={user?.full_name ? `ยินดีต้อนรับ, ${user.full_name}` : undefined}
          icon={LayoutDashboard}
          actions={
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-card transition-colors hover:bg-surface-raised hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              รีเฟรช
            </button>
          }
        />

        {/* ตัวชี้วัดหลัก — ยุบจาก 10 การ์ดเดิมเหลือ 4 ตัวที่ใช้ตัดสินใจได้จริง */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            label="อัตราการเช่า"
            value={`${occupancyRate}%`}
            caption={`${activeTenants} จาก ${totalCondos} ห้อง`}
            icon={Percent}
            tone={occupancyRate >= 80 ? "success" : occupancyRate >= 50 ? "warning" : "danger"}
            hint="สัดส่วนห้องที่มีผู้เช่าอยู่ในปัจจุบัน"
            loading={isLoading}
          />
          <MetricCard
            label="กำไรสุทธิเดือนนี้"
            value={formatBaht(currentMonth?.net ?? 0)}
            icon={Wallet}
            tone={(currentMonth?.net ?? 0) >= 0 ? "success" : "danger"}
            delta={netDelta !== undefined ? { value: netDelta } : undefined}
            spark={monthlyData.map((m) => m.net)}
            hint="รายรับหักรายจ่ายของเดือนปัจจุบัน เทียบกับเดือนก่อนหน้า"
            loading={isLoading}
          />
          <MetricCard
            label="รายรับเดือนนี้"
            value={formatBaht(currentMonth?.income ?? 0)}
            caption={`รายจ่าย ${formatBaht(currentMonth?.expense ?? 0)}`}
            icon={TrendingUp}
            tone="info"
            delta={incomeDelta !== undefined ? { value: incomeDelta } : undefined}
            hint="รายรับรวมทุกแหล่งของเดือนปัจจุบัน"
            loading={isLoading}
          />
          <MetricCard
            label="ห้องว่าง"
            value={vacantRooms}
            caption={vacantRooms === 0 ? "เช่าเต็มทุกห้อง" : `จากทั้งหมด ${totalCondos} ห้อง`}
            icon={DoorOpen}
            tone={vacantRooms > 0 ? "warning" : "success"}
            hint="จำนวนห้องที่ยังไม่มีผู้เช่า"
            loading={isLoading}
          />
        </div>

        {/* แถบค้างชำระ — รวมการ์ด 2 ใบเดิมให้เหลือแถบเดียวที่พาไปหน้าจัดการค่าเช่าได้ */}
        {!isLoading && (unpaidPayments.length > 0 || overduePayments.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-warning/25 bg-warning-muted/60 px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
            {overduePayments.length > 0 && (
              <span className="text-sm text-destructive">
                เกินกำหนด <span className="tabular font-semibold">{formatBaht(totalOverdueAmount)}</span>
                <span className="text-muted-foreground"> · {overduePayments.length} รายการ</span>
              </span>
            )}
            {unpaidPayments.length > 0 && (
              <span className="text-sm text-warning">
                ยังไม่ชำระ <span className="tabular font-semibold">{formatBaht(totalUnpaidAmount)}</span>
                <span className="text-muted-foreground"> · {unpaidPayments.length} รายการ</span>
              </span>
            )}
            <Link
              href="/rent"
              className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-background/40"
            >
              จัดการค่าเช่า
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {/*
            แท่งคู่ต่อเดือน: รายรับ (เขียว) คู่กับรายจ่าย (ส้ม) อ่านเทียบกันได้ตรง ๆ
            ไม่ซ้อนเส้นกำไรสุทธิทับ เพราะเดือนที่ขาดทุนจะดึงแกน Y ให้กางลงติดลบ
            จนครึ่งล่างว่างเปล่าและแท่งถูกบีบจนอ่านไม่ออก — net ดูจาก sparkline ในการ์ด KPI แทน
          */}
          <Panel className="lg:col-span-2">
            <PanelHeader
              title="รายรับ – รายจ่าย 6 เดือนล่าสุด"
              icon={TrendingUp}
              actions={
                <ChartLegend
                  items={[
                    { label: "รายรับ", color: chart["chart-2"] },
                    { label: "รายจ่าย", color: chart["chart-3"] },
                  ]}
                />
              }
            />
            {isLoading ? (
              <ChartSkeleton height={300} />
            ) : !hasChartData ? (
              <ChartEmpty height={300} message="ยังไม่มีข้อมูลรายรับรายจ่าย" />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 12, right: 4, left: -8, bottom: 0 }}
                    barGap={4}
                    barCategoryGap="22%"
                  >
                    <defs>
                      {/* แท่งเข้มที่ยอดแล้วจางลงหาฐาน ให้ดูมีน้ำหนักโดยไม่ทึบตัน */}
                      <ChartGradient id="incomeFill" color={chart["chart-2"]} from={1} to={0.55} />
                      <ChartGradient id="expenseFill" color={chart["chart-3"]} from={0.9} to={0.45} />
                    </defs>
                    <CartesianGrid {...gridProps(chart)} />
                    <XAxis dataKey="name" {...axisProps(chart)} dy={8} />
                    <YAxis
                      {...axisProps(chart)}
                      tickFormatter={(v: number) => formatCompactBaht(v)}
                      width={56}
                    />
                    <RechartsTooltip
                      cursor={{ fill: chart["chart-grid"], opacity: 0.35, radius: 8 }}
                      content={<ChartTooltip formatter={(value) => formatBaht(value)} />}
                    />
                    <Bar
                      dataKey="income"
                      name="รายรับ"
                      fill="url(#incomeFill)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={38}
                    />
                    <Bar
                      dataKey="expense"
                      name="รายจ่าย"
                      fill="url(#expenseFill)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={38}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          {/* สัดส่วนสถานะการชำระ — แทน pie chart เดิมด้วยแถบสัดส่วนที่อ่านง่ายกว่า */}
          <Panel>
            <PanelHeader title="สถานะการชำระค่าเช่า" icon={Clock} />
            {isLoading ? (
              <div className="space-y-4">
                <div className="mx-auto h-[172px] w-[172px] animate-pulse rounded-full bg-muted" />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-6 w-full animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : statusBreakdown.total === 0 ? (
              <ChartEmpty height={180} message="ยังไม่มีรายการค่าเช่า" />
            ) : (
              <div className="space-y-4">
                {/* โดนัทพร้อมยอดรวมกลางวง เป็นจุดยึดสายตาของคอลัมน์นี้ */}
                <div className="relative mx-auto h-[172px] w-[172px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusBreakdown.rows.filter((row) => row.count > 0)}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius="66%"
                        outerRadius="94%"
                        paddingAngle={statusBreakdown.rows.filter((row) => row.count > 0).length > 1 ? 3 : 0}
                        stroke="none"
                      >
                        {statusBreakdown.rows
                          .filter((row) => row.count > 0)
                          .map((row) => (
                            <Cell key={row.key} fill={row.color} />
                          ))}
                      </Pie>
                      <RechartsTooltip
                        content={<ChartTooltip formatter={(value) => `${value} รายการ`} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="tabular text-2xl font-semibold text-foreground">
                      {statusBreakdown.total}
                    </span>
                    <span className="text-[11px] text-muted-foreground">รายการทั้งหมด</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {statusBreakdown.rows.map((row) => {
                    const percent = statusBreakdown.total > 0 ? Math.round((row.count / statusBreakdown.total) * 100) : 0
                    return (
                      <div key={row.key} className="flex items-center justify-between gap-3 py-1.5">
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: row.color }} />
                          {row.label}
                        </span>
                        <span className="tabular text-sm">
                          <span className="font-medium text-foreground">{row.count}</span>
                          <span className="ml-1.5 text-xs text-muted-foreground">{percent}%</span>
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-border pt-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      อัตราการเช่า
                    </span>
                    <span className="tabular font-medium text-foreground">{occupancyRate}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* ครบกำหนดใน 7 วัน */}
        {!isLoading && upcomingPayments.length > 0 && (
          <Panel>
            <PanelHeader
              title="ครบกำหนดใน 7 วัน"
              description={`${upcomingPayments.length} รายการ`}
              icon={CalendarClock}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingPayments.map((payment: any) => {
                const tenant = payment.tenant
                const dueDate = new Date(payment.due_date)
                const daysLeft = differenceInDays(dueDate, new Date())
                const urgency = daysLeft <= 1 ? "danger" : daysLeft <= 3 ? "warning" : "info"

                return (
                  <div
                    key={payment.id}
                    className="rounded-lg border border-border bg-surface-raised p-3.5 transition-colors hover:border-border-strong"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {tenant?.full_name || "ไม่ทราบ"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {tenant?.condo ? `${tenant.condo.name} · ${tenant.condo.room_number}` : "—"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                          urgency === "danger" && "bg-destructive-muted text-destructive",
                          urgency === "warning" && "bg-warning-muted text-warning",
                          urgency === "info" && "bg-info-muted text-info",
                        )}
                      >
                        {daysLeft === 0 ? "วันนี้" : daysLeft === 1 ? "พรุ่งนี้" : `อีก ${daysLeft} วัน`}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-xs">
                      <span className="text-muted-foreground">{format(dueDate, "d MMM yyyy", { locale: th })}</span>
                      <span className="tabular font-medium text-foreground">{formatBaht(payment.amount)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        )}

        {/* ตารางเดียวพร้อมตัวสลับ แทนสองตารางเดิมที่ใช้คอลัมน์ชุดเดียวกัน */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground sm:text-lg">
              <Bell className="h-4 w-4 text-muted-foreground" />
              รายการค่าเช่า
            </h2>
            <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
              {(
                [
                  { id: "outstanding", label: "ค้างชำระ", count: outstandingRows.length },
                  { id: "paid", label: "ชำระแล้ว", count: paidRows.length },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPaymentTab(tab.id)}
                  aria-pressed={paymentTab === tab.id}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                    paymentTab === tab.id
                      ? "bg-surface-raised text-foreground shadow-card"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  <span className="tabular ml-1.5 text-[11px] text-muted-foreground">{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          <DataTable
            data={activeRows}
            columns={paymentColumns}
            loading={isLoading}
            emptyMessage={
              paymentTab === "outstanding" ? "ไม่มีรายการค้างชำระ" : "ยังไม่มีรายการที่ชำระแล้ว"
            }
            itemsPerPage={8}
            showPagination
          />
        </div>
      </div>
    </MainLayout>
  )
}
