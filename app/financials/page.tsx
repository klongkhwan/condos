"use client";

import { DollarSign, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { DocumentUploadModal } from "@/components/documents/document-upload-modal";
import { DocumentDeleteConfirm } from "@/components/documents/document-delete-confirm";
import { useNotification } from "@/lib/hooks/use-notification";
import { useAuth } from "@/lib/auth-context";
import {
  useCondos,
  useTenants,
  useFinancialRecords,
  useDataInvalidation,
} from "@/lib/hooks/use-queries";

import { DOCUMENT_TYPES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "./constants";
import { useFinancialFilters } from "./hooks/use-financial-filters";
import { useFinancialForm } from "./hooks/use-financial-form";
import { useFinancialDocuments } from "./hooks/use-financial-documents";
import { useRecordDelete } from "./hooks/use-record-delete";
import { FinancialFilters } from "./components/financial-filters";
import { RecordsSection } from "./components/records-section";
import { RecordFormModal } from "./components/record-form-modal";

export default function FinancialsPage() {
  const { user } = useAuth();
  const { condos } = useCondos(user?.id);
  const { tenants } = useTenants(user?.id);
  const { incomeRecords, expenseRecords, loading } = useFinancialRecords(user?.id);
  const { afterFinancialChange, afterDocumentChange } = useDataInvalidation(user?.id);
  const { setNotification, notificationElement } = useNotification();

  const filters = useFinancialFilters(incomeRecords, expenseRecords);
  const form = useFinancialForm({
    condos,
    tenants,
    notify: setNotification,
    onSaved: afterFinancialChange,
  });
  const docs = useFinancialDocuments({
    notify: setNotification,
    onChanged: afterDocumentChange,
  });
  const recordDelete = useRecordDelete({
    notify: setNotification,
    onDeleted: afterFinancialChange,
  });

  const sharedFilterKey = `${filters.selectedCondoFilter}-${filters.selectedYear}-${filters.selectedMonth}`;

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {notificationElement}

        <PageHeader
          title="การเงิน"
          description="ติดตามรายรับและรายจ่ายสำหรับอสังหาริมทรัพย์ของคุณ"
          icon={Wallet}
          actions={
            <button
              onClick={() => form.openModal("income")}
              className="flex items-center px-3 py-2 sm:px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm"
            >
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">เพิ่มรายการ</span>
              <span className="sm:hidden">เพิ่ม</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <StatsCard title="รายได้รวม" value={`฿${filters.totalIncome.toLocaleString()}`} icon={TrendingUp} />
          <StatsCard title="ค่าใช้จ่ายรวม" value={`฿${filters.totalExpenses.toLocaleString()}`} icon={TrendingDown} />
          <StatsCard
            title="กำไรสุทธิ"
            value={`฿${filters.netIncome.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 0, isPositive: filters.netIncome >= 0 }}
          />
        </div>

        <FinancialFilters
          condos={condos}
          selectedCondo={filters.selectedCondoFilter}
          onCondoChange={filters.setSelectedCondoFilter}
          selectedYear={filters.selectedYear}
          onYearChange={filters.setSelectedYear}
          yearOptions={filters.yearOptions}
          selectedMonth={filters.selectedMonth}
          onMonthChange={filters.setSelectedMonth}
          resultCount={filters.filteredIncomeRecords.length + filters.filteredExpenseRecords.length}
        />

        <RecordsSection
          type="income"
          title="รายการรายรับ"
          records={filters.filteredIncomeRecords}
          categories={INCOME_CATEGORIES}
          selectedCategory={filters.selectedIncomeCategory}
          onCategoryChange={filters.setSelectedIncomeCategory}
          condos={condos}
          loading={loading}
          emptyMessage="ไม่พบรายการรายรับ"
          tableKey={`income-${filters.selectedIncomeCategory}-${sharedFilterKey}`}
          onEdit={form.editRecord}
          onAttach={docs.openFileModal}
          onDelete={recordDelete.requestDelete}
        />

        <RecordsSection
          type="expense"
          title="รายการรายจ่าย"
          records={filters.filteredExpenseRecords}
          categories={EXPENSE_CATEGORIES}
          selectedCategory={filters.selectedExpenseCategory}
          onCategoryChange={filters.setSelectedExpenseCategory}
          condos={condos}
          loading={loading}
          emptyMessage="ไม่พบรายการรายจ่าย"
          tableKey={`expense-${filters.selectedExpenseCategory}-${sharedFilterKey}`}
          onEdit={form.editRecord}
          onAttach={docs.openFileModal}
          onDelete={recordDelete.requestDelete}
        />

        <RecordFormModal form={form} condos={condos} />

        <DocumentUploadModal
          isOpen={!!docs.selected}
          onClose={docs.closeFileModal}
          title={`แนบไฟล์สำหรับ ${docs.selected?.record.type || "รายการ"}`}
          description={`เอกสารจะถูกผูกกับ${docs.selected?.type === "expense" ? "รายการรายจ่าย" : "รายการรายรับ"}นี้`}
          documentTypes={DOCUMENT_TYPES}
          documentType={docs.documentType}
          onDocumentTypeChange={docs.setDocumentType}
          files={docs.uploadedFiles}
          onFilesChange={docs.setUploadedFiles}
          documents={docs.documents}
          documentsLoading={docs.documentsLoading}
          onDeleteDocument={docs.requestDelete}
          onSubmit={docs.submitUpload}
          isUploading={docs.isUploading}
          existingTitle="เอกสารที่มีอยู่สำหรับรายการนี้"
        />

        <DocumentDeleteConfirm
          doc={docs.docToDelete}
          onCancel={docs.cancelDelete}
          onConfirm={docs.confirmDelete}
          isDeleting={docs.isDeleting}
        />

        <ConfirmationModal
          isOpen={!!recordDelete.pending}
          onClose={recordDelete.cancelDelete}
          onConfirm={recordDelete.confirmDelete}
          title={`ยืนยันการลบรายการ${recordDelete.pending?.type === "income" ? "รายรับ" : "รายจ่าย"}`}
          message={`คุณต้องการลบรายการ "${recordDelete.pending?.name}" นี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
          confirmText="ยืนยัน"
          cancelText="ยกเลิก"
          type="danger"
          isLoading={recordDelete.isDeleting}
          loadingText="กำลังลบ..."
        />
      </div>
    </MainLayout>
  );
}
