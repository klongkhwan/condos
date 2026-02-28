"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus, Copy, Edit, X, TrendingUp, TrendingDown, DollarSign, ChevronLeft, ChevronRight, BarChart3, Download } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Notification } from "@/components/ui/notification";
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

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PersonalFinanceRecord | null>(null);
  
  // Delete confirm states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  // Copy confirm states
  const [isCopyConfirmOpen, setIsCopyConfirmOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

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
    setIsCopyConfirmOpen(true);
  };

  const confirmCopyMonth = async () => {
    if (!selectedMonth) return;
    setIsCopying(true);

    // Calculate previous month string
    const [yearStr, monthStr] = selectedMonth.split('-');
    let pYear = parseInt(yearStr);
    let pMonth = parseInt(monthStr) - 1;
    if (pMonth === 0) {
      pMonth = 12;
      pYear -= 1;
    }
    const previousMonth = `${pYear}-${String(pMonth).padStart(2, '0')}`;

    try {
      const result = await copyPersonalFinancesFromMonthAction(previousMonth, selectedMonth, user?.id || "");
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

  const handleDeleteClick = (id: string) => {
    setRecordToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    
    try {
      const result = await deletePersonalFinanceAction(recordToDelete);
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
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">รายรับ-รายจ่ายส่วนตัว</h1>
            <p className="text-sm sm:text-base text-gray-400">
              ภาพรวมรายรับ-รายจ่ายประจำเดือน
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={openReportModal}
              className="flex items-center px-3 py-2 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-900/20 text-sm"
              title="ดูรายงานผลรวมรายปี"
            >
              <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">รายงาน</span>
              <span className="sm:hidden">รายงาน</span>
            </button>
          </div>
        </div>

        {/* Month Selector & Summary Row */}
        <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 items-start">
            {/* Filter and Actions Group */}
            <div className="flex flex-col gap-3 shrink-0 w-full xl:w-auto min-w-[280px]">
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-2 sm:p-4 flex items-center justify-center">
                <div className="flex items-center justify-between w-full space-x-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
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
                    <span className="text-lg sm:text-xl font-bold text-white text-center group-hover:text-green-400 transition-colors">
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
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>
              
              <button
                 onClick={handleCopyMonth}
                 title="คัดลอกข้อมูลจากเดือนก่อนหน้ามายังเดือนปัจจุบัน"
                 className="w-full justify-center items-center flex px-3 py-2 sm:px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700 text-sm shadow-sm"
              >
                 <Copy className="h-4 w-4 mr-1 sm:mr-2 text-gray-400" />
                 <span>คัดลอกข้อมูลเดือนก่อนหน้า</span>
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
                  valueClassName={netBalance > 0 ? "text-green-400" : netBalance < 0 ? "text-red-400" : "text-white"}
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
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm flex flex-col h-[400px] sm:h-[600px]">
            <div className="bg-green-600/20 px-4 py-3 border-b border-green-600/30 flex justify-between items-center shrink-0">
               <h3 className="font-semibold text-green-400">รายรับ</h3>
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
                  className="p-1 hover:bg-green-500/20 rounded-md transition-colors text-green-400"
                  title="เพิ่มรายรับ"
               >
                 <Plus className="h-4 w-4" />
               </button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-sm text-gray-300 relative">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800/95 sticky top-0 z-10 shadow-sm border-b border-gray-700">
                  <tr>
                    <th className="px-3 py-3 font-medium text-center w-12 shrink-0">ลำดับ</th>
                    <th className="px-3 py-3 font-medium w-full">รายละเอียด</th>
                    <th className="px-3 py-3 font-medium text-right sm:text-left whitespace-nowrap w-24 shrink-0">วันที่</th>
                    <th className="px-3 py-3 font-medium text-right whitespace-nowrap w-24 shrink-0">จำนวนเงิน</th>
                    <th className="px-3 py-3 font-medium text-center w-20 shrink-0">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">กำลังโหลด...</td></tr>
                  ) : incomeRecords.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">ไม่มีข้อมูลรายรับ</td></tr>
                  ) : (
                    incomeRecords.map((record: PersonalFinanceRecord, index: number) => (
                      <tr key={record.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-3 py-3 text-center text-gray-500">{index + 1}</td>
                        <td className="px-3 py-3 break-all sm:break-normal">{record.description || "-"}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-right sm:text-left">{new Date(record.date).toLocaleDateString("th-TH")}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-right font-medium text-green-400">
                          {record.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                           <div className="flex justify-center space-x-1">
                              <button onClick={() => openModal(record)} className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-blue-400/10 rounded-md transition-colors" title="แก้ไข"><Edit className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleDeleteClick(record.id)} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-400/10 rounded-md transition-colors" title="ลบ"><X className="h-3.5 w-3.5" /></button>
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
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm flex flex-col h-[400px] sm:h-[600px]">
            <div className="bg-red-600/20 px-4 py-3 border-b border-red-600/30 flex justify-between items-center shrink-0">
               <h3 className="font-semibold text-red-400">รายจ่าย</h3>
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
                  className="p-1 hover:bg-red-500/20 rounded-md transition-colors text-red-400"
                  title="เพิ่มรายจ่าย"
               >
                 <Plus className="h-4 w-4" />
               </button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-sm text-gray-300 relative">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800/95 sticky top-0 z-10 shadow-sm border-b border-gray-700">
                  <tr>
                    <th className="px-3 py-3 font-medium text-center w-12 shrink-0">ลำดับ</th>
                    <th className="px-3 py-3 font-medium w-full">รายละเอียด</th>
                    <th className="px-3 py-3 font-medium text-right sm:text-left whitespace-nowrap w-24 shrink-0">วันที่</th>
                    <th className="px-3 py-3 font-medium text-right whitespace-nowrap w-24 shrink-0">จำนวนเงิน</th>
                    <th className="px-3 py-3 font-medium text-center w-20 shrink-0">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">กำลังโหลด...</td></tr>
                  ) : expenseRecords.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">ไม่มีข้อมูลรายจ่าย</td></tr>
                  ) : (
                    expenseRecords.map((record: PersonalFinanceRecord, index: number) => (
                      <tr key={record.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-3 py-3 text-center text-gray-500">{index + 1}</td>
                        <td className="px-3 py-3 break-all sm:break-normal">{record.description || "-"}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-right sm:text-left">{new Date(record.date).toLocaleDateString("th-TH")}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-right font-medium text-red-400">
                          {record.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                           <div className="flex justify-center space-x-1">
                              <button onClick={() => openModal(record)} className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-blue-400/10 rounded-md transition-colors" title="แก้ไข"><Edit className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleDeleteClick(record.id)} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-400/10 rounded-md transition-colors" title="ลบ"><X className="h-3.5 w-3.5" /></button>
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ประเภท <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "income" })}
                  className={`py-2.5 px-4 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                    formData.type === "income"
                      ? "bg-green-600/20 border-green-500 text-green-400 font-medium"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
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
                      ? "bg-red-600/20 border-red-500 text-red-400 font-medium"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  <TrendingDown className="h-4 w-4" />
                  รายจ่าย
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                วันที่ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                คำอธิบายรายละเอียด
              </label>
              <input
                type="text"
                placeholder="เช่น ค่าข้าว, เงินเดือน, บิลค่าน้ำ..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                จำนวนเงิน (บาท) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium flex justify-center items-center"
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
        message="คุณต้องการลบรายการนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบ"
        cancelText="ยกเลิก"
        type="danger"
      />

       {/* Copy Confirmation */}
       <ConfirmationModal
        isOpen={isCopyConfirmOpen}
        onClose={() => setIsCopyConfirmOpen(false)}
        onConfirm={confirmCopyMonth}
        title="ยืนยันการคัดลอกข้อมูล"
        message="คุณต้องการคัดลอกข้อมูลรายรับ/รายจ่าย ทั้งหมดจากเดือนก่อนหน้ามาใส่ในเดือนปัจจุบันใช่หรือไม่?"
        confirmText={isCopying ? "กำลังคัดลอก..." : "ยืนยันคัดลอก"}
        cancelText="ยกเลิก"
        type="info"
      />

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
                <label className="text-sm font-medium text-gray-300">เลือกปี:</label>
                <select
                  value={reportYear}
                  onChange={(e) => fetchYearlyReport(parseInt(e.target.value))}
                  className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year + 543}</option>
                  ))}
                </select>
             </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-gray-700 bg-gray-800">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-3 py-2 font-medium text-center">เดือน</th>
                  <th className="px-3 py-2 font-medium text-right text-green-400/80">รายรับ</th>
                  <th className="px-3 py-2 font-medium text-right text-red-400/80">รายจ่าย</th>
                  <th className="px-3 py-2 font-medium text-right">ยอดสุทธิ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {isFetchingReport ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">กำลังดึงข้อมูล...</td></tr>
                ) : yearlyReportData.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">ไม่มีข้อมูลในปีที่เลือก</td></tr>
                ) : (
                  <>
                    {yearlyReportData.map((row) => {
                      const date = new Date(reportYear, row.month - 1, 1);
                      const monthName = date.toLocaleDateString('th-TH', { month: 'long' });
                      const isPositive = row.net >= 0;
                      return (
                        <tr key={row.month} className="hover:bg-gray-700/50 transition-colors text-xs sm:text-sm">
                          <td className="px-3 py-1.5 sm:py-2 text-center font-medium">{monthName}</td>
                          <td className="px-3 py-1.5 sm:py-2 text-right text-green-400">
                            {row.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-1.5 sm:py-2 text-right text-red-400">
                            {row.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`px-3 py-1.5 sm:py-2 text-right font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {row.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Totals Row */}
                    <tr className="bg-gray-900/50 border-t-2 border-gray-600 font-bold text-xs sm:text-sm">
                       <td className="px-3 py-2 sm:py-3 text-center text-gray-200">รวมทั้งปี</td>
                       <td className="px-3 py-2 sm:py-3 text-right text-green-400">
                         {yearlyReportData.reduce((acc, row) => acc + row.income, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </td>
                       <td className="px-3 py-2 sm:py-3 text-right text-red-400">
                         {yearlyReportData.reduce((acc, row) => acc + row.expense, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </td>
                       <td className={`px-3 py-2 sm:py-3 text-right ${yearlyReportData.reduce((acc, row) => acc + row.net, 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
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
               className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
