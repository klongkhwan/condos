"use client";

import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { DocumentUploadModal } from "@/components/documents/document-upload-modal";
import { DocumentDeleteConfirm } from "@/components/documents/document-delete-confirm";
import { useNotification } from "@/lib/hooks/use-notification";
import { useAuth } from "@/lib/auth-context";
import type { Tenant } from "@/lib/supabase";
import { useCondos, useTenants, useDataInvalidation } from "@/lib/hooks/use-queries";

import { TENANT_DOCUMENT_TYPES, type StatusFilter } from "./constants";
import { useTenantForm } from "./hooks/use-tenant-form";
import { useEndContract } from "./hooks/use-end-contract";
import { useTenantDocuments } from "./hooks/use-tenant-documents";
import { TenantFilters } from "./components/tenant-filters";
import { TenantFormModal } from "./components/tenant-form-modal";
import { EndContractModal } from "./components/end-contract-modal";
import { InstallmentModal } from "./components/installment-modal";
import { buildTenantColumns } from "./components/tenant-columns";

export default function TenantsPage() {
  const { user } = useAuth();
  const { tenants, loading } = useTenants(user?.id);
  const { condos } = useCondos(user?.id);
  const { afterTenantChange, afterDocumentChange } = useDataInvalidation(user?.id);
  const { setNotification, notificationElement } = useNotification();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [selectedCondoFilter, setSelectedCondoFilter] = useState("");
  const [installmentTenant, setInstallmentTenant] = useState<Tenant | null>(null);

  const form = useTenantForm({ notify: setNotification, onSaved: afterTenantChange });
  const endContract = useEndContract({ notify: setNotification, onEnded: afterTenantChange });
  const docs = useTenantDocuments({ notify: setNotification, onChanged: afterDocumentChange });

  // useTenants กรองตาม condo ของ user มาแล้ว
  const filteredTenants = useMemo(
    () =>
      tenants.filter((tenant) => {
        const statusMatch =
          statusFilter === "all" ||
          (statusFilter === "active" && tenant.is_active) ||
          (statusFilter === "vacant" && !tenant.is_active);
        const condoMatch = !selectedCondoFilter || tenant.condo_id === selectedCondoFilter;
        return statusMatch && condoMatch;
      }),
    [tenants, statusFilter, selectedCondoFilter],
  );

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {notificationElement}

        <PageHeader
          title="ผู้เช่า"
          description="จัดการผู้เช่าและสัญญาเช่า"
          icon={Users}
          actions={
            <button
              onClick={form.openCreateModal}
              className="flex items-center px-3 py-2 sm:px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm"
            >
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              เพิ่มผู้เช่า
            </button>
          }
        />

        <TenantFilters
          condos={condos}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          selectedCondo={selectedCondoFilter}
          onCondoChange={setSelectedCondoFilter}
          resultCount={filteredTenants.length}
        />

        <DataTable
          data={filteredTenants}
          columns={buildTenantColumns({
            condos,
            onEdit: form.openEditModal,
            onAttach: docs.openFileModal,
            onEndContract: endContract.open,
            onShowInstallments: setInstallmentTenant,
          })}
          loading={loading}
          emptyMessage="ไม่พบผู้เช่า เพิ่มผู้เช่าแรกของคุณเพื่อเริ่มต้น"
          itemsPerPage={5}
        />

        <TenantFormModal form={form} condos={condos} tenants={tenants} />

        <EndContractModal state={endContract} />

        <DocumentUploadModal
          isOpen={!!docs.selectedTenant}
          onClose={docs.closeFileModal}
          title={`แนบไฟล์ - ${docs.selectedTenant?.full_name || ""}`}
          documentTypes={TENANT_DOCUMENT_TYPES}
          documentType={docs.documentType}
          onDocumentTypeChange={docs.setDocumentType}
          files={docs.uploadedFiles}
          onFilesChange={docs.setUploadedFiles}
          documents={docs.documents}
          documentsLoading={docs.documentsLoading}
          onDeleteDocument={docs.requestDelete}
          onSubmit={docs.submitUpload}
          isUploading={docs.isUploading}
          showEmptyDocuments
        />

        <DocumentDeleteConfirm
          doc={docs.docToDelete}
          onCancel={docs.cancelDelete}
          onConfirm={docs.confirmDelete}
          isDeleting={docs.isDeleting}
        />

        <InstallmentModal tenant={installmentTenant} onClose={() => setInstallmentTenant(null)} />
      </div>
    </MainLayout>
  );
}
