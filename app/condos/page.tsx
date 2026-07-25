"use client";

import type React from "react";
import { useState } from "react";
import { Plus, Edit, FileText, Upload, File, X, Eye, AlertCircle, Loader2, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { MainLayout } from "@/components/layout/main-layout";
import { fieldClass } from "@/components/ui/field";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useNotification } from "@/lib/hooks/use-notification";
import { DocumentPreview } from "@/components/ui/document-preview";
import { ImageCompressInput } from "@/components/ui/image-compress-input";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@/lib/auth-context";
import type { Condo } from "@/lib/supabase";
import {
  useCondos,
  useDocuments,
  useDataInvalidation,
} from "@/lib/hooks/use-queries";

import {
  uploadDocument,
  deleteDocumentAction,
} from "@/app/actions/document-actions"; // Import Server Actions
import {
  createCondoAction,
  updateCondoAction,
  deleteCondoAction,
} from "@/app/actions/condo-actions";

import { NumericFormat } from "react-number-format";

// Static data hoisted outside component to prevent recreation on every render
// See: Vercel Best Practices - rendering-hoist-jsx
const CONDO_DOCUMENT_TYPES = [
  { value: "condo_image", label: "รูปคอนโด" },
  { value: "purchase_contract", label: "สัญญาเช่าซื้อขาย" },
  { value: "land_deed", label: "โฉนด" },
  { value: "insurance", label: "ประกัน" },
  { value: "other", label: "อื่นๆ" },
];

export default function CondosPage() {
  const { user } = useAuth();
  const { condos, loading } = useCondos(user?.id);
  const { afterCondoChange, afterDocumentChange } = useDataInvalidation(user?.id);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  // ปิดใช้งานคอนโด
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCondo, setSelectedCondo] = useState<Condo | null>(null);

  // ลบเอกสารด้วย ConfirmationModal
  const [isDocDeleteModalOpen, setIsDocDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{
    id: string;
    fileUrl: string | null;
    name: string;
  } | null>(null);

  
  const [editingCondo, setEditingCondo] = useState<Condo | null>(null);

  const {
    documents: condoDocuments,
    loading: condoDocumentsLoading,
  } = useDocuments({
    condoId: selectedCondo?.id,
    scope: "condo",
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification state
  const { setNotification, notificationElement } = useNotification();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    room_number: "",
    description: "",
    purchase_price: "",
    purchase_date: "",
    seller: "",
    area: "",
    loan_term: "",
    installment_amount: "",
    payment_due_date: "",
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    address?: string;
    purchase_price?: string;
    purchase_date?: string;
    installment_amount?: string;
    payment_due_date?: string;
  }>({});

  const validateForm = () => {
    const errors: typeof formErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = "กรุณากรอกชื่อคอนโด";
    }
    if (!formData.address.trim()) {
      errors.address = "กรุณากรอกที่อยู่";
    }
    if (!formData.purchase_price) {
      errors.purchase_price = "กรุณากรอกราคาซื้อ";
    }
    if (!formData.purchase_date) {
      errors.purchase_date = "กรุณาเลือกวันที่ซื้อ";
    }
    if (!formData.installment_amount) {
      errors.installment_amount = "กรุณากรอกยอดผ่อนต่อเดือน";
    }
    if (!formData.payment_due_date) {
      errors.payment_due_date = "กรุณากรอกวันที่ครบชำระ";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    const condoData = {
      ...formData,
      user_id: user?.id || "",
      purchase_price: formData.purchase_price
        ? parseFloat(formData.purchase_price)
        : undefined,
      area: formData.area ? parseFloat(formData.area) : undefined,
      loan_term: formData.loan_term
        ? parseFloat(formData.loan_term)
        : undefined,
      installment_amount: formData.installment_amount
        ? parseFloat(formData.installment_amount)
        : undefined,
      is_active: true,
    };

    try {
      if (editingCondo) {
        const result = await updateCondoAction(editingCondo.id, condoData);
        if (result.success) {
          setNotification({
            message: "บันทึกสำเร็จ",
            type: "success",
          });
          afterCondoChange();
        } else {
          throw new Error(result.message);
        }
      } else {
        const result = await createCondoAction(condoData);
        if (result.success) {
          setNotification({ message: "เพิ่มคอนโดใหม่สำเร็จ", type: "success" });
          afterCondoChange();
        } else {
          throw new Error(result.message);
        }
      }
      resetForm();
    } catch (error) {
      console.error("Error saving condo:", error);
      setNotification({
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูลคอนโด",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      room_number: "",
      description: "",
      purchase_price: "",
      purchase_date: "",
      seller: "",
      area: "",
      loan_term: "",
      installment_amount: "",
      payment_due_date: "",
    });
    setFormErrors({});
    setEditingCondo(null);
    setIsModalOpen(false);
  };

  const handleEdit = (condo: Condo) => {
    setFormData({
      name: condo.name,
      address: condo.address,
      room_number: condo.room_number || "",
      description: condo.description || "",
      purchase_price: condo.purchase_price?.toString() || "",
      purchase_date: condo.purchase_date || "",
      seller: condo.seller || "",
      area: condo.area?.toString() || "",
      loan_term: condo.loan_term?.toString() || "",
      installment_amount: condo.installment_amount?.toString() || "",
      payment_due_date: condo.payment_due_date || "",
    });
    setEditingCondo(condo);
    setIsModalOpen(true);
  };

  const handleDelete = (condo: Condo) => {
    setSelectedCondo(condo);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedCondo) {
      setIsDeleting(true);
      try {
        const result = await updateCondoAction(selectedCondo.id, { is_active: false });
        if (result.success) {
          setNotification({
            message: `คอนโด "${selectedCondo.name}" ถูกปิดใช้งานแล้ว`,
            type: "success",
          });
          afterCondoChange();
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error("Error deactivating condo:", error);
        setNotification({
          message: "เกิดข้อผิดพลาดในการปิดใช้งานคอนโด",
          type: "error",
        });
      } finally {
        setIsDeleting(false);
        setSelectedCondo(null);
        setIsDeleteModalOpen(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const openFileModal = (condo: Condo) => {
    setSelectedCondo(condo);
    setUploadedFiles([]);
    setDocumentType("");
    setIsFileModalOpen(true);
    // Documents are automatically fetched by useDocuments when selectedCondo changes
  };

  const handleFileSubmit = async () => {
    if (uploadedFiles.length === 0) {
      setNotification({
        message: "กรุณาเลือกไฟล์ที่ต้องการอัปโหลด",
        type: "error",
      });
      return;
    }
    if (!documentType) {
      setNotification({ message: "กรุณาเลือกประเภทเอกสาร", type: "error" });
      return;
    }
    if (!selectedCondo) return;

    setIsUploading(true);
    try {
      for (const file of uploadedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("condoId", selectedCondo.id);
        formData.append("documentType", documentType);

        const result = await uploadDocument(formData);
        if (!result.success) {
          throw new Error(result.message);
        }
      }
      setNotification({ message: `บันทึกสำเร็จ`, type: "success" });
      setUploadedFiles([]);
      setDocumentType("");
      setIsFileModalOpen(false);
      afterDocumentChange();
    } catch (error: any) {
      console.error("Error uploading files:", error);
      setNotification({
        message: `เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ${error.message}`,
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // --- แก้ให้ใช้ ConfirmationModal สำหรับลบเอกสาร ---
  const handleDocumentDelete = (docId: string, fileUrl: string, docName: string) => {
    setDocToDelete({ id: docId, fileUrl, name: docName });
    setIsDocDeleteModalOpen(true);
  };


  const confirmDocDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteDocumentAction(
        docToDelete.id,
        docToDelete.fileUrl || ""   // <-- บังคับส่งเสมอ (เหมือนของเก่า)
      );
      if (!result.success) throw new Error(result.message);
      setNotification({ message: `เอกสาร "${docToDelete.name}" ถูกลบแล้ว`, type: "success" });
      afterDocumentChange();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      setNotification({ message: `เกิดข้อผิดพลาดในการลบเอกสาร: ${error.message}`, type: "error" });
    } finally {
      setIsDeleting(false);
      setIsDocDeleteModalOpen(false);
      setDocToDelete(null);
    }
  };

  // --- จบส่วนแก้ไข ---

  const columns = [
    {
      key: "name",
      header: "ชื่อคอนโด",
    },
    {
      key: "address",
      header: "ที่อยู่",
      render: (condo: Condo) => (
        <div className="max-w-xs truncate" title={condo.address}>
          {condo.address}
        </div>
      ),
    },
    {
      key: "room_number",
      header: "หมายเลขห้อง",
    },

    {
      key: "purchase_price",
      header: "ราคาซื้อ",
      render: (condo: Condo) =>
        condo.purchase_price
          ? `฿${condo.purchase_price.toLocaleString()}`
          : "ไม่ระบุ",
    },
    {
      key: "installment_amount",
      header: "ยอดผ่อนต่อเดือน",
      render: (condo: Condo) =>
        condo.installment_amount !== undefined &&
        condo.installment_amount !== null
          ? `฿${condo.installment_amount.toLocaleString()}`
          : "-",
    },
    {
      key: "payment_due_date",
      header: "วันที่ชำระงวด",
    },
    {
      key: "actions",
      header: "การดำเนินการ",
      render: (condo: Condo) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(condo)}
            className="text-info hover:text-info"
            title="แก้ไข"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => openFileModal(condo)}
            className="text-success hover:text-success"
            title="แนบไฟล์"
          >
            <FileText className="h-4 w-4" />
          </button>
          {/* <button onClick={() => handleDelete(condo)} className="text-destructive hover:text-destructive" title="ปิดใช้งาน">
            <X className="h-4 w-4" />
          </button> */}
        </div>
      ),
    },
  ];


  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Notification */}
        {notificationElement}

        <PageHeader
          title="คอนโด"
          description="จัดการคอนโดของคุณ"
          icon={Building2}
          actions={
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-3 py-2 sm:px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm"
            >
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              เพิ่มคอนโด
            </button>
          }
        />

        {/* Condos Table */}
        <DataTable
          data={condos.filter((c) => c.is_active)}
          columns={columns}
          loading={loading}
          emptyMessage="ไม่พบคอนโด เพิ่มคอนโดแรกของคุณเพื่อเริ่มต้น"
          itemsPerPage={10}
        />

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={resetForm}
          title={editingCondo ? "แก้ไขคอนโด" : "เพิ่มคอนโดใหม่"}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="condos-f1">
                  ชื่อคอนโด <span className="text-destructive">*</span>
                </label>
                <input id="condos-f1"
                  type="text"
                  maxLength={50}
                  placeholder="ระบุชื่อคอนโด"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                  }}
                  className={fieldClass(!!formErrors.name)}
                />
                {formErrors.name && (
                  <div className="flex items-center mt-1 text-destructive text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {formErrors.name}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="condos-f2">
                  หมายเลขห้อง
                </label>
                <input id="condos-f2"
                  type="text"
                  value={formData.room_number}
                  maxLength={10}
                  placeholder="ระบุหมายเลขห้อง"
                  onChange={(e) =>
                    setFormData({ ...formData, room_number: e.target.value })
                  }
                  className={fieldClass()}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="condos-f3">
                ที่อยู่ <span className="text-destructive">*</span>
              </label>
              <textarea id="condos-f3"
                value={formData.address}
                maxLength={255}
                placeholder="ระบุที่อยู่"
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  if (formErrors.address) setFormErrors({ ...formErrors, address: undefined });
                }}
                className={fieldClass(!!formErrors.address)}
                rows={2}
              />
              {formErrors.address && (
                <div className="flex items-center mt-1 text-destructive text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {formErrors.address}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="condos-f4">
                รายละเอียด
              </label>
              <textarea id="condos-f4"
                value={formData.description}
                maxLength={255}
                placeholder="ระบุรายละเอียด"
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={fieldClass()}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="condos-f5">
                  ราคาซื้อ (บาท) <span className="text-destructive">*</span>
                </label>
                <NumericFormat
                  thousandSeparator=","
                  decimalScale={2}
                  allowNegative={false}
                  value={formData.purchase_price}
                  onValueChange={(values) => {
                    setFormData({ ...formData, purchase_price: values.value });
                    if (formErrors.purchase_price) setFormErrors({ ...formErrors, purchase_price: undefined });
                  }}
                  className={fieldClass(!!formErrors.purchase_price)}
                  placeholder="0.00"
                />
                {formErrors.purchase_price && (
                  <div className="flex items-center mt-1 text-destructive text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {formErrors.purchase_price}
                  </div>
                )}
              </div>
              <div>
                <DatePicker
                  label="วันที่ซื้อ"
                  id="purchase_date"
                  value={formData.purchase_date ? new Date(formData.purchase_date) : undefined}
                  onChange={(date) => {
                    if (date) {
                        const year = date.getFullYear()
                        const month = String(date.getMonth() + 1).padStart(2, '0')
                        const day = String(date.getDate()).padStart(2, '0')
                        const formattedDate = `${year}-${month}-${day}`
                        setFormData({ 
                            ...formData, 
                            purchase_date: formattedDate
                        });
                    } else {
                        setFormData({ 
                            ...formData, 
                            purchase_date: '' 
                        });
                    }
                    if (formErrors.purchase_date) setFormErrors({ ...formErrors, purchase_date: undefined });
                  }}
                  required
                  error={formErrors.purchase_date}
                />
              </div>
              <div>
                <label htmlFor="condos-f5" className="block text-sm font-medium text-foreground mb-1">
                  ขนาดพื้นที่ (ตร.ม.)
                </label>
                <input id="condos-f5"
                  type="number"
                  min="0"
                  value={formData.area || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, area: e.target.value })
                  }
                  className={fieldClass()}
                  placeholder="เช่น 35.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="condos-f6">
                  ระยะเวลากู้ (ปี)
                </label>
                <input id="condos-f6"
                  type="number"
                  min="0"
                  value={formData.loan_term || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, loan_term: e.target.value })
                  }
                  className={fieldClass()}
                  placeholder="เช่น 30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="condos-f7">
                  ยอดผ่อนต่อเดือน (บาท) <span className="text-destructive">*</span>
                </label>
                <NumericFormat
                  thousandSeparator=","
                  decimalScale={2}
                  allowNegative={false}
                  value={formData.installment_amount}
                  onValueChange={(values) => {
                    setFormData({
                      ...formData,
                      installment_amount: values.value,
                    });
                    if (formErrors.installment_amount) setFormErrors({ ...formErrors, installment_amount: undefined });
                  }}
                  className={fieldClass(!!formErrors.installment_amount)}
                  placeholder="0.00"
                />
                {formErrors.installment_amount && (
                  <div className="flex items-center mt-1 text-destructive text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {formErrors.installment_amount}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="condos-f7" className="block text-sm font-medium text-foreground mb-1">
                  วันที่ครบชำระรายเดือน <span className="text-destructive">*</span>
                </label>
                <input id="condos-f7"
                  type="text"
                  maxLength={20}
                  value={formData.payment_due_date || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      payment_due_date: e.target.value,
                    });
                    if (formErrors.payment_due_date) setFormErrors({ ...formErrors, payment_due_date: undefined });
                  }}
                  className={fieldClass(!!formErrors.payment_due_date)}
                  placeholder="ระบุวันครบชำระ"
                />
                {formErrors.payment_due_date && (
                  <div className="flex items-center mt-1 text-destructive text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {formErrors.payment_due_date}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="condos-f8">
                  ผู้ขาย
                </label>
                <input id="condos-f8"
                  type="text"
                  value={formData.seller}
                  maxLength={50}
                  placeholder="ระบุผู้ขาย"
                  onChange={(e) =>
                    setFormData({ ...formData, seller: e.target.value })
                  }
                  className={fieldClass()}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/90 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึก"
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* File Upload Modal */}
        <Modal
          isOpen={isFileModalOpen}
          onClose={() => {
            setIsFileModalOpen(false);
            setSelectedCondo(null);
            setUploadedFiles([]);
            setDocumentType("");
          }}
          title={`แนบไฟล์ - ${selectedCondo?.name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="condos-f9">
                ประเภทเอกสาร *
              </label>
              <select id="condos-f9"
                required
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className={fieldClass()}
              >
                <option value="">เลือกประเภทเอกสาร</option>
                {CONDO_DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <ImageCompressInput
              files={uploadedFiles}
              onFilesChange={setUploadedFiles}
              label="เลือกไฟล์เอกสาร"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              maxSizeKB={100}
              disabled={isUploading}
              showCompressInfo={true}
            />

            <DocumentPreview
              documents={condoDocuments}
              documentTypes={CONDO_DOCUMENT_TYPES}
              loading={condoDocumentsLoading}
              onDeleteDocument={handleDocumentDelete}
              title="เอกสารที่มีอยู่"
              maxColumns={2}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsFileModalOpen(false);
                  setSelectedCondo(null);
                  setUploadedFiles([]);
                  setDocumentType("");
                }}
                className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/90 hover:text-foreground transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleFileSubmit}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  uploadedFiles.length === 0 || !documentType || isUploading
                }
              >
                {isUploading
                  ? "กำลังอัปโหลด..."
                  : `บันทึก (${uploadedFiles.length})`}
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Document Confirmation Modal */}
        <ConfirmationModal
          isOpen={isDocDeleteModalOpen}
          onClose={() => {
            setIsDocDeleteModalOpen(false);
            setDocToDelete(null);
          }}
          onConfirm={confirmDocDelete}
          title="ยืนยันการลบเอกสาร"
          message={`คุณแน่ใจหรือไม่ว่าต้องการลบเอกสาร "${
            docToDelete?.name || ""
          }"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
          confirmText="ยืนยัน"
          cancelText="ยกเลิก"
          type="danger"
          isLoading={isDeleting}
          loadingText="กำลังลบ..."
        />

        
        {/* Delete Condo Confirmation Modal (ถ้าจะใช้ ให้เอาคอมเมนต์ออก) */}
        {/*
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="ปิดใช้งานคอนโด"
          message={`คุณต้องการปิดใช้งานคอนโด "${selectedCondo?.name}" หรือไม่? คอนโดจะถูกซ่อนจากรายการแต่ข้อมูลจะยังคงอยู่`}
          confirmText="ปิดใช้งาน"
          cancelText="ยกเลิก"
          type="warning"
        />
        */}
      </div>
    </MainLayout>
  );
}
