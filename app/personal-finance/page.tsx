"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus, Copy, Edit, X, TrendingUp, TrendingDown, DollarSign, ChevronLeft, ChevronRight, BarChart3, Download, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { MainLayout } from "@/components/layout/main-layout";
import { useNotification } from "@/lib/hooks/use-notification";
import { StatsCard } from "@/components/ui/stats-card";
import { Modal } from "@/components/ui/modal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useAuth } from "@/lib/auth-context";
import { usePersonalFinancesByMonth } from "@/lib/hooks/use-personal-finances";
import {
  createPersonalFinanceAction,
  updatePersonalFinanceAction,
  deletePersonalFinanceAction,
  copyPersonalFinancesFromMonthAction,
  getYearlyPersonalFinanceSummaryAction,
  getAvailablePersonalFinanceYearsAction,
} from "@/app/actions/personal-finance-actions";
import type { PersonalFinanceRecord } from "@/lib/supabase";

export default function PersonalFinancePage() {
  const { user } = useAuth();
  const monthInputRef = React.useRef<HTMLInputElement>(null);
  
  // State for Month Selection (YYYY-MM format)
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    // Set default month to current month on client side to avoid hydration mismatch
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(currentMonth);
  }, []);

  const { records, summary, loading, refetch } = usePersonalFinancesByMonth(user?.id, selectedMonth);

  const { setNotification, notificationElement } = useNotification();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PersonalFinanceRecord | null>(null);
  
  // Delete confirm states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<PersonalFinanceRecord | null>(null);

  // Copy confirm states
  const [isCopyConfirmOpen, setIsCopyConfirmOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copySourceMonth, setCopySourceMonth] = useState<string>("");

  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    date: "",
    description: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [yearlyReportData, setYearlyReportData] = useState<any[]>([]);
  const [isFetchingReport, setIsFetchingReport] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Handlers
  const formatMonthTh = (yyyyMm: string) => {
    if (!yyyyMm) return "";
    const [y, m] = yyyyMm.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  };

  const handlePrevMonth = () => {
    if (!selectedMonth) return;
    const [y, m] = selectedMonth.split('-');
    let year = parseInt(y);
    let month = parseInt(m) - 1;
    if (month === 0) { month = 12; year--; }
    setSelectedMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    if (!selectedMonth) return;
    const [y, m] = selectedMonth.split('-');
    let year = parseInt(y);
    let month = parseInt(m) + 1;
    if (month === 13) { month = 1; year++; }
    setSelectedMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const handleCopyMonth = () => {
    if (selectedMonth) {
      const [yearStr, monthStr] = selectedMonth.split('-');
      let pYear = parseInt(yearStr);
      let pMonth = parseInt(monthStr) - 1;
      if (pMonth === 0) {
        pMonth = 12;
        pYear -= 1;
      }
      setCopySourceMonth(`${pYear}-${String(pMonth).padStart(2, '0')}`);
    }
    setIsCopyConfirmOpen(true);
  };

  const confirmCopyMonth = async () => {
    if (!selectedMonth || !copySourceMonth) return;
    setIsCopying(true);

    try {
      const result = await copyPersonalFinancesFromMonthAction(copySourceMonth, selectedMonth, user?.id || "");
      if (result.success) {
        setNotification({ message: `คัดลอกข้อมูลเรียบร้อย ${result.count} รายการ`, type: "success" });
        refetch();
      } else {
        setNotification({ message: result.message || "เกิดข้อผิดพลาดในการคัดลอก", type: "error" });
      }
    } catch (error: any) {
      setNotification({ message: error.message || "เกิดข้อผิดพลาดในการคัดลอก", type: "error" });
    } finally {
      setIsCopying(false);
      setIsCopyConfirmOpen(false);
    }
  };

  const openReportModal = async () => {
    if (!user?.id) return;
    setIsReportModalOpen(true);
    
    // Fetch available years
    try {
      const yearsResult = await getAvailablePersonalFinanceYearsAction(user.id);
      if (yearsResult.success && yearsResult.data) {
        setAvailableYears(yearsResult.data);
         // If current selected year is not in available years, switch to the latest available
         if (yearsResult.data.length > 0 && !yearsResult.data.includes(reportYear)) {
             const latestYear = yearsResult.data[0];
             setReportYear(latestYear);
             fetchYearlyReport(latestYear);
         } else {
             fetchYearlyReport(reportYear);
         }
      } else {
        fetchYearlyReport(reportYear); // fallback
      }
    } catch {
      fetchYearlyReport(reportYear); // fallback
    }
  };

  const fetchYearlyReport = async (year: number) => {
    if (!user?.id) return;
    setIsFetchingReport(true);
    setReportYear(year);
    try {
      const result = await getYearlyPersonalFinanceSummaryAction(year, user.id);
      if (result.success && result.data) {
        setYearlyReportData(result.data);
      } else {
        setNotification({ message: result.message || "ดึงข้อมูลรายงานไม่สำเร็จ", type: "error" });
      }
    } catch (e: any) {
      setNotification({ message: e.message || "เกิดข้อผิดพลาดในการดึงข้อมูล", type: "error" });
    } finally {
      setIsFetchingReport(false);
    }
  };

  const openModal = (record?: PersonalFinanceRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        type: record.type,
        amount: record.amount.toString(),
        date: record.date,
        description: record.description || "",
      });
    } else {
      setEditingRecord(null);
      
      // Default date to today if we're in the current month, else the 1st of the selected month
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      
      let defaultDate = "";
      if (selectedMonth === currentMonthStr) {
        // use local date
        const offset = now.getTimezoneOffset()
        const localNow = new Date(now.getTime() - (offset*60*1000))
        defaultDate = localNow.toISOString().split("T")[0];
      } else if (selectedMonth) {
        defaultDate = `${selectedMonth}-01`;
      }

      setFormData({
        type: "expense",
        amount: "",
        date: defaultDate,
        description: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.date) return;
    
    setIsSaving(true);
    const dataToSubmit = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      date: formData.date,
      description: formData.description,
    };

    try {
      if (editingRecord) {
        const result = await updatePersonalFinanceAction(editingRecord.id, dataToSubmit);
        if (result.success) {
          setNotification({ message: "อัปเดตข้อมูลสำเร็จ", type: "success" });
          refetch();
          setIsModalOpen(false);
        } else {
          setNotification({ message: result.message || "อัปเดตล้มเหลว", type: "error" });
        }
      } else {
        const result = await createPersonalFinanceAction({ ...dataToSubmit, user_id: user?.id || "" });
        if (result.success) {
          setNotification({ message: "เพิ่มข้อมูลสำเร็จ", type: "success" });
          refetch();
          setIsModalOpen(false);
        } else {
          setNotification({ message: result.message || "เพิ่มล้มเหลว", type: "error" });
        }
      }
    } catch (error: any) {
      setNotification({ message: error.message || "เกิดข้อผิดพลาด", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (record: PersonalFinanceRecord) => {
    setRecordToDelete(record);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    
    try {
      const result = await deletePersonalFinanceAction(recordToDelete.id);
      if (result.success) {
        setNotification({ message: "ลบข้อมูลสำเร็จ", type: "success" });
        refetch();
      } else {
        setNotification({ message: result.message || "ลบล้มเหลว", type: "error" });
      }
    } catch (error: any) {
       setNotification({ message: error.message || "เกิดข้อผิดพลาดในการลบ", type: "error" });
    } finally {
      setIsDeleteConfirmOpen(false);
      setRecordToDelete(null);
    }
  };

  // Calculations
  // Calculations (Now coming from RPC summary)
  const incomeRecords = records.filter((r: PersonalFinanceRecord) => r.type === "income");
  const expenseRecords = records.filter((r: PersonalFinanceRecord) => r.type === "expense");
  const totalIncome = summary?.total_income || 0;
  const totalExpense = summary?.total_expense || 0;
  const netBalance = totalIncome - totalExpense;

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {notificationElement}

        <PageHeader
          title="รายรับ-รายจ่ายส่วนตัว"
          description="ภาพรวมรายรับ-รายจ่ายประจำเดือน"
          icon={Wallet}
          actions={
            <button
              onClick={openReportModal}
              className="flex items-center px-3 py-2 sm:px-4 bg-info hover:bg-info/90 text-info-foreground rounded-lg transition-colors text-sm"
              title="ดูรายงานผลรวมรายปี"
            >
              <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
              รายงาน
            </button>
          }
        />

        {/* Month Selector & Summary Row */}
        <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 items-start">
            {/* Filter and Actions Group */}
            <div className="flex flex-col gap-3 shrink-0 w-full xl:w-auto min-w-[280px]">
              <div className="bg-card rounded-lg border border-border p-2 sm:p-4 flex items-center justify-center">
                <div className="flex items-center justify-between w-full space-x-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors flex-shrink-0"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  
                  <div 
                    className="relative flex items-center justify-center flex-1 cursor-pointer group"
                    onClick={() => {
                      try {
                        monthInputRef.current?.showPicker();
                      } catch (e) {
                        monthInputRef.current?.focus();
                      }
                    }}
                  >
                    <span className="text-lg sm:text-xl font-bold text-foreground text-center group-hover:text-primary transition-colors">
                      {formatMonthTh(selectedMonth)}
                    </span>
                    <input 
                      ref={monthInputRef}
                      type="month" 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="absolute inset-0 opacity-0 pointer-events-none"
                      tabIndex={-1}
                    />
                  </div>

                  <button
                    onClick={handleNextMonth}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors flex-shrink-0"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>
              
              <button
                 onClick={handleCopyMonth}
                 title="คัดลอกข้อมูลจากเดือนอื่นมายังเดือนปัจจุบัน"
                 className="w-full justify-center items-center flex px-3 py-2 sm:px-4 bg-card hover:bg-accent text-foreground rounded-lg transition-colors border border-border text-sm shadow-sm"
              >
                 <Copy className="h-4 w-4 mr-1 sm:mr-2 text-muted-foreground" />
                 <span>คัดลอกข้อมูลจากเดือนอื่น</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
               <StatsCard
                  title="รายรับรวม"
                  value={`฿${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={TrendingUp}
                />
                <StatsCard
                  title="รายจ่ายรวม"
                  value={`฿${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={TrendingDown}
                />
                <StatsCard
                  title="ยอดคงเหลือสุทธิ"
                  value={`฿${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  valueClassName={netBalance > 0 ? "text-success" : netBalance < 0 ? "text-destructive" : "text-foreground"}
                  icon={DollarSign}
                  trend={
                    netBalance >= 0
                      ? { value: 0, isPositive: true }
                      : { value: 0, isPositive: false }
                  }
                />
            </div>
        </div>

        {/* Split Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 items-start">
          
          {/* Income Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col h-[400px] sm:h-[600px]">
            <div className="bg-primary/20 px-4 py-3 border-b border-primary/30 flex justify-between items-center shrink-0">
               <h3 className="font-semibold text-success">รายรับ</h3>
               <button 
                  onClick={() => {
                     setEditingRecord(null);
                     const now = new Date();
                     const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                     let defaultDate = "";
                     if (selectedMonth === currentMonthStr) {
                       const offset = now.getTimezoneOffset()
                       const localNow = new Date(now.getTime() - (offset*60*1000))
                       defaultDate = localNow.toISOString().split("T")[0];
                     } else if (selectedMonth) {
                       defaultDate = `${selectedMonth}-01`;
                     }
                     setFormData({ type: "income", amount: "", date: defaultDate, description: "" });
                     setIsModalOpen(true);
                  }}
                  className="p-1 hover:bg-success-muted rounded-md transition-colors text-success"
                  title="เพิ่มรายรับ"
               >
                 <Plus className="h-4 w-4" />
               </button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-sm text-foreground relative">
                <thead className="text-xs text-muted-foreground uppercase bg-card/95 sticky top-0 z-10 shadow-sm border-b border-border">
                  <tr>
                    <th className="px-3 py-3 font-medium text-center w-12 shrink-0">ลำดับ</th>
                    <th className="px-3 py-3 font-medium w-full">รายละเอียด</th>
                    <th className="px-3 py-3 font-medium text-right sm:text-left whitespace-nowrap w-24 shrink-0">วันที่</th>
                    <th className="px-3 py-3 font-medium text-right whitespace-nowrap w-24 shrink-0">จำนวนเงิน</th>
                    <th className="px-3 py-3 font-medium text-center w-20 shrink-0">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">กำลังโหลด...</td></tr>
                  ) : incomeRecords.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">ไม่มีข้อมูลรายรับ</td></tr>
                  ) : (
                    incomeRecords.map((record: PersonalFinanceRecord, index: number) => (
                      <tr key={record.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-3 py-3 text-center text-muted-foreground">{index + 1}</td>
                        <td className="px-3 py-3 break-all sm:break-normal">{record.description || "-"}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-right sm:text-left">{new Date(record.date).toLocaleDateString("th-TH")}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-right font-medium text-success">
                          {record.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                           <div className="flex justify-center space-x-1">
                              <button onClick={() => openModal(record)} className="text-info hover:text-info p-1.5 hover:bg-info-muted rounded-md transition-colors" title="แก้ไข"><Edit className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleDeleteClick(record)} className="text-destructive hover:text-destructive p-1.5 hover:bg-destructive-muted rounded-md transition-colors" title="ลบ"><X className="h-3.5 w-3.5" /></button>
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expense Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col h-[400px] sm:h-[600px]">
            <div className="bg-destructive/20 px-4 py-3 border-b border-destructive/30 flex justify-between items-center shrink-0">
               <h3 className="font-semibold text-destructive">รายจ่าย</h3>
               <button 
                  onClick={() => {
                     setEditingRecord(null);
                     const now = new Date();
                     const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                     let defaultDate = "";
                     if (selectedMonth === currentMonthStr) {
                       const offset = now.getTimezoneOffset()
                       const localNow = new Date(now.getTime() - (offset*60*1000))
                       defaultDate = localNow.toISOString().split("T")[0];
                     } else if (selectedMonth) {
                       defaultDate = `${selectedMonth}-01`;
                     }
                     setFormData({ type: "expense", amount: "", date: defaultDate, description: "" });
                     setIsModalOpen(true);
                  }}
                  className="p-1 hover:bg-destructive-muted rounded-md transition-colors text-destructive"
                  title="เพิ่มรายจ่าย"
               >
                 <Plus className="h-4 w-4" />
               </button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-sm text-foreground relative">
                <thead className="text-xs text-muted-foreground uppercase bg-card/95 sticky top-0 z-10 shadow-sm border-b border-border">
                  <tr>
                    <th className="px-3 py-3 font-medium text-center w-12 shrink-0">ลำดับ</th>
                    <th className="px-3 py-3 font-medium w-full">รายละเอียด</th>
                    <th className="px-3 py-3 font-medium text-right sm:text-left whitespace-nowrap w-24 shrink-0">วันที่</th>
                    <th className="px-3 py-3 font-medium text-right whitespace-nowrap w-24 shrink-0">จำนวนเงิน</th>
                    <th className="px-3 py-3 font-medium text-center w-20 shrink-0">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">กำลังโหลด...</td></tr>
                  ) : expenseRecords.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">ไม่มีข้อมูลรายจ่าย</td></tr>
                  ) : (
                    expenseRecords.map((record: PersonalFinanceRecord, index: number) => (
                      <tr key={record.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-3 py-3 text-center text-muted-foreground">{index + 1}</td>
                        <td className="px-3 py-3 break-all sm:break-normal">{record.description || "-"}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-right sm:text-left">{new Date(record.date).toLocaleDateString("th-TH")}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-right font-medium text-destructive">
                          {record.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                           <div className="flex justify-center space-x-1">
                              <button onClick={() => openModal(record)} className="text-info hover:text-info p-1.5 hover:bg-info-muted rounded-md transition-colors" title="แก้ไข"><Edit className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleDeleteClick(record)} className="text-destructive hover:text-destructive p-1.5 hover:bg-destructive-muted rounded-md transition-colors" title="ลบ"><X className="h-3.5 w-3.5" /></button>
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)}
         title={editingRecord ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
      >
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2" htmlFor="personal-finance-f1">
                ประเภท <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "income" })}
                  className={`py-2.5 px-4 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                    formData.type === "income"
                      ? "bg-primary/20 border-primary text-success font-medium"
                      : "bg-card border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  รายรับ
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "expense" })}
                  className={`py-2.5 px-4 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                    formData.type === "expense"
                      ? "bg-destructive/20 border-destructive text-destructive font-medium"
                      : "bg-card border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <TrendingDown className="h-4 w-4" />
                  รายจ่าย
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="personal-finance-f1" className="block text-sm font-medium text-foreground mb-1.5">
                วันที่ <span className="text-destructive">*</span>
              </label>
              <input id="personal-finance-f1"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-card border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="personal-finance-f2">
                คำอธิบายรายละเอียด
              </label>
              <input id="personal-finance-f2"
                type="text"
                placeholder="เช่น ค่าข้าว, เงินเดือน, บิลค่าน้ำ..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-card border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="personal-finance-f3">
                จำนวนเงิน (บาท) <span className="text-destructive">*</span>
              </label>
              <input id="personal-finance-f3"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 bg-card border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-muted hover:bg-accent text-foreground rounded-lg transition-colors font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors font-medium flex justify-center items-center"
              >
                {isSaving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="ยืนยันการลบรายการ"
        message={
          <>
            คุณต้องการลบรายการ <strong>{recordToDelete?.description || "ไม่มีรายละเอียด"}</strong> ใช่หรือไม่?
            <br />
            การกระทำนี้ไม่สามารถย้อนกลับได้
          </>
        }
        confirmText="ลบ"
        cancelText="ยกเลิก"
        type="danger"
      />

       {/* Copy Modal */}
      <Modal
        isOpen={isCopyConfirmOpen}
        onClose={() => setIsCopyConfirmOpen(false)}
        title="คัดลอกข้อมูลจากเดือนอื่น"
      >
        <div className="space-y-4">
          <div className="bg-info/10 border border-info/25 rounded-lg p-4 text-info text-sm">
            คุณต้องการคัดลอกข้อมูลรายรับ/รายจ่าย ทั้งหมดจากเดือนที่เลือก มาใส่ในเดือน <strong>{formatMonthTh(selectedMonth)}</strong> ใช่หรือไม่?
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="personal-finance-f4">
              เลือกเดือนต้นทาง
            </label>
            <input id="personal-finance-f4"
              type="month"
              value={copySourceMonth}
              onChange={(e) => setCopySourceMonth(e.target.value)}
              className="w-full px-3 py-2 bg-card border border-input rounded-lg text-foreground focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCopyConfirmOpen(false)}
              className="flex-1 px-4 py-2 bg-muted hover:bg-accent text-foreground rounded-lg transition-colors font-medium"
            >
              ยกเลิก
            </button>
            <button
              onClick={confirmCopyMonth}
              disabled={isCopying || !copySourceMonth}
              className="flex-1 px-4 py-2 bg-info hover:bg-info/90 disabled:opacity-50 text-info-foreground rounded-lg transition-colors font-medium flex justify-center items-center"
            >
              {isCopying ? "กำลังคัดลอก..." : "ยืนยันคัดลอก"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Yearly Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="รายงานสรุปรายปี"
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-foreground" htmlFor="personal-finance-f5">เลือกปี:</label>
                <select id="personal-finance-f5"
                  value={reportYear}
                  onChange={(e) => fetchYearlyReport(parseInt(e.target.value))}
                  className="px-3 py-1.5 bg-card border border-input rounded-lg text-foreground focus:ring-ring focus:border-ring text-sm"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year + 543}</option>
                  ))}
                </select>
             </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="text-xs text-muted-foreground uppercase bg-card border-b border-border">
                <tr>
                  <th className="px-3 py-2 font-medium text-center">เดือน</th>
                  <th className="px-3 py-2 font-medium text-right text-success/80">รายรับ</th>
                  <th className="px-3 py-2 font-medium text-right text-destructive/80">รายจ่าย</th>
                  <th className="px-3 py-2 font-medium text-right">ยอดสุทธิ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isFetchingReport ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">กำลังดึงข้อมูล...</td></tr>
                ) : yearlyReportData.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">ไม่มีข้อมูลในปีที่เลือก</td></tr>
                ) : (
                  <>
                    {yearlyReportData.map((row) => {
                      const date = new Date(reportYear, row.month - 1, 1);
                      const monthName = date.toLocaleDateString('th-TH', { month: 'long' });
                      const isPositive = row.net >= 0;
                      return (
                        <tr key={row.month} className="hover:bg-accent/50 transition-colors text-xs sm:text-sm">
                          <td className="px-3 py-1.5 sm:py-2 text-center font-medium">{monthName}</td>
                          <td className="px-3 py-1.5 sm:py-2 text-right text-success">
                            {row.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-1.5 sm:py-2 text-right text-destructive">
                            {row.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`px-3 py-1.5 sm:py-2 text-right font-bold ${isPositive ? 'text-primary' : 'text-destructive'}`}>
                            {row.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Totals Row */}
                    <tr className="bg-card/60 border-t-2 border-input font-bold text-xs sm:text-sm">
                       <td className="px-3 py-2 sm:py-3 text-center text-foreground">รวมทั้งปี</td>
                       <td className="px-3 py-2 sm:py-3 text-right text-success">
                         {yearlyReportData.reduce((acc, row) => acc + row.income, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </td>
                       <td className="px-3 py-2 sm:py-3 text-right text-destructive">
                         {yearlyReportData.reduce((acc, row) => acc + row.expense, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </td>
                       <td className={`px-3 py-2 sm:py-3 text-right ${yearlyReportData.reduce((acc, row) => acc + row.net, 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                         {yearlyReportData.reduce((acc, row) => acc + row.net, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button
               onClick={() => setIsReportModalOpen(false)}
               className="px-4 py-2 bg-muted hover:bg-accent text-foreground rounded-lg transition-colors font-medium"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
