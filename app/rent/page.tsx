"use client";

import { AlertTriangle, Check, Clock, CreditCard, Plus } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { DocumentDeleteConfirm } from "@/components/documents/document-delete-confirm";
import { useNotification } from "@/lib/hooks/use-notification";
import { useAuth } from "@/lib/auth-context";
import {
  useCondos,
  useTenants,
  useRentPayments,
  useDataInvalidation,
} from "@/lib/hooks/use-queries";

import { useRentFilters } from "./hooks/use-rent-filters";
import { usePaymentEditor } from "./hooks/use-payment-editor";
import { usePaymentDelete } from "./hooks/use-payment-delete";
import { RentFilters } from "./components/rent-filters";
import { PaymentFormModal } from "./components/payment-form-modal";
import { buildPaymentColumns } from "./components/payment-columns";

export default function RentPage() {
  const { user } = useAuth();
  const { payments, loading } = useRentPayments(user?.id);
  const { condos } = useCondos(user?.id);
  const { tenants } = useTenants(user?.id);
  const { afterPaymentChange, afterDocumentChange } = useDataInvalidation(user?.id);
  const { setNotification, notificationElement } = useNotification();

  const filters = useRentFilters(payments);
  const editor = usePaymentEditor({
    tenants,
    notify: setNotification,
    onSaved: afterPaymentChange,
    onDocumentsChanged: afterDocumentChange,
  });
  const paymentDelete = usePaymentDelete({
    notify: setNotification,
    onDeleted: afterPaymentChange,
  });

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {notificationElement}

        <PageHeader
          title="จัดการค่าเช่า"
          description="ติดตามและจัดการการชำระค่าเช่า"
          icon={CreditCard}
          actions={
            <button
              onClick={editor.openCreate}
              className="flex items-center px-3 py-2 sm:px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm"
            >
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">เพิ่มรายการค่าเช่า</span>
              <span className="sm:hidden">เพิ่ม</span>
            </button>
          }
        />

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <MetricCard
            label="ยังไม่ชำระ"
            value={filters.countByStatus.unpaid}
            icon={Clock}
            tone="warning"
            loading={loading}
          />
          <MetricCard
            label="เกินกำหนด"
            value={filters.countByStatus.overdue}
            icon={AlertTriangle}
            tone="danger"
            loading={loading}
          />
          <MetricCard
            label="ชำระแล้ว"
            value={filters.countByStatus.paid}
            icon={Check}
            tone="success"
            loading={loading}
          />
        </div>

        <RentFilters filters={filters} condos={condos} />

        <DataTable
          data={filters.filteredPayments}
          columns={buildPaymentColumns({
            onEdit: editor.openEdit,
            onDelete: paymentDelete.requestDelete,
          })}
          loading={loading}
          emptyMessage="ไม่พบรายการชำระค่าเช่า"
          itemsPerPage={12}
        />

        <PaymentFormModal editor={editor} tenants={tenants} condos={condos} />

        <DocumentDeleteConfirm
          doc={editor.docs.docToDelete}
          onCancel={editor.docs.cancelDelete}
          onConfirm={editor.docs.confirmDelete}
          isDeleting={editor.docs.isDeleting}
        />

        <ConfirmationModal
          isOpen={!!paymentDelete.payment}
          onClose={paymentDelete.cancelDelete}
          onConfirm={paymentDelete.confirmDelete}
          title="ยืนยันการลบรายการชำระเงิน"
          message={`คุณแน่ใจหรือไม่ว่าต้องการลบรายการชำระเงินของ ${
            paymentDelete.payment?.tenant?.full_name || "นี้"
          } จำนวน ฿${
            paymentDelete.payment?.amount.toLocaleString() || "N/A"
          }? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
          confirmText="ยืนยัน"
          cancelText="ยกเลิก"
          type="danger"
          isLoading={paymentDelete.isDeleting}
          loadingText="กำลังลบ..."
        />
      </div>
    </MainLayout>
  );
}
