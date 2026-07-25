"use client";

import type React from "react";
import { useState, useMemo } from "react";
// Import Trash icon
import {
  Plus,
  Check,
  AlertTriangle,
  Clock,
  Upload,
  File,
  X,
  Filter,
  Edit,
  Eye,
  Trash,
  AlertCircle,
  Loader2,
  CreditCard,
} from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { fieldClass } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { useNotification } from "@/lib/hooks/use-notification";
// Import ConfirmationModal
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { DocumentPreview } from "@/components/ui/document-preview"; // Import DocumentPreview
import { ImageCompressInput } from "@/components/ui/image-compress-input"; // Import ImageCompressInput
import { DatePicker } from "@/components/ui/date-picker";
import {
  useCondos,
  useTenants,
  useRentPayments,
  useDocuments,
  useDataInvalidation,
} from "@/lib/hooks/use-queries";

import { useAuth } from "@/lib/auth-context";
import type { RentPayment } from "@/lib/supabase";
import {
  uploadDocument,
  deleteDocumentAction,
} from "@/app/actions/document-actions"; // Import Server Actions
import {
  createPaymentAction,
  updatePaymentAction,
  deletePaymentAction,
} from "@/app/actions/rent-actions";

import { NumericFormat } from "react-number-format";

// Static data hoisted outside component to prevent recreation on every render
// See: Vercel Best Practices - rendering-hoist-jsx
const MONTHS_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const PAYMENT_DOCUMENT_TYPES = [
  { value: "payment_receipt", label: "ใบเสร็จการชำระ" },
  { value: "bank_slip", label: "สลิปโอนเงิน" },
  { value: "proof", label: "หลักฐานการชำระ" },
  { value: "other", label: "อื่นๆ" },
];

export default function RentPage() {
  const { user } = useAuth();
  const {
    payments,
    loading,
  } = useRentPayments(user?.id);
  const { condos } = useCondos(user?.id);
  const { tenants } = useTenants(user?.id);
  const { afterPaymentChange, afterDocumentChange } = useDataInvalidation(
    user?.id,
  );
  const [isCreatePaymentModalOpen, setIsCreatePaymentModalOpen] =
    useState(false);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false); // New state for edit modal
  const [selectedPayment, setSelectedPayment] = useState<RentPayment | null>(
    null
  );
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Document states for payment receipts
  const {
    documents: paymentDocuments,
    loading: paymentDocumentsLoading,
  } = useDocuments({
    paymentId: selectedPayment?.id,
    documentType: "payment_receipt",
  });



  const [isRentDocDeleteModalOpen, setIsRentDocDeleteModalOpen] =
    useState(false);
  const [rentDocToDelete, setRentDocToDelete] = useState<{
    id: string;
    fileUrl: string; // ส่งเป็น string เสมอ ตามพฤติกรรมเดิม
    name: string;
  } | null>(null);

  // Filter states
  const [selectedCondoFilter, setSelectedCondoFilter] = useState<string>("");
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>(""); // New tenant filter
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<
    "all" | "unpaid" | "paid" | "overdue"
  >("all");
  const [selectedYearFilter, setSelectedYearFilter] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("");

  // Get unique tenants from payments data (includes past tenants with payment history)
  const filteredTenantsForFilter = useMemo(() => {
    if (!selectedCondoFilter) {
      return []; // Return empty when no condo selected (dropdown will be disabled)
    }
    
    // Filter payments by selected condo first
    const condoPayments = payments.filter(
      (p) => p.tenant?.condo_id === selectedCondoFilter
    );
    
    // Extract unique tenants from these payments
    const tenantMap = new Map<string, { id: string; full_name: string }>();
    condoPayments.forEach((p) => {
      if (p.tenant && !tenantMap.has(p.tenant_id)) {
        tenantMap.set(p.tenant_id, {
          id: p.tenant_id,
          full_name: p.tenant.full_name || "ไม่ทราบชื่อ",
        });
      }
    });
    
    return Array.from(tenantMap.values());
  }, [payments, selectedCondoFilter]);


  // เพิ่มรายการปีจากข้อมูล payments
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5; // ย้อนหลัง 5 ปี
    const endYear = currentYear + 1; // หน้า 1 ปี

    const yearList = [];
    for (let year = endYear; year >= startYear; year--) {
      yearList.push(year);
    }
    return yearList;
  }, []);

  // Notification state
  const { setNotification, notificationElement } = useNotification();

  // Form data for creating/editing payment record
  const [formData, setFormData] = useState({
    tenant_id: "",
    amount: "",
    due_date: "",
    paid_date: "",
    status: "unpaid" as "unpaid" | "paid" | "overdue",
    notes: "",
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{
    tenant_id?: string;
    amount?: string;
    due_date?: string;
    paid_date?: string;
  }>({});

  const validatePaymentForm = () => {
    const errors: typeof formErrors = {};
    
    if (!formData.tenant_id) {
      errors.tenant_id = "กรุณาเลือกผู้เช่า";
    }
    if (!formData.amount) {
      errors.amount = "กรุณากรอกจำนวนเงิน";
    }
    if (!formData.due_date) {
      errors.due_date = "กรุณาเลือกวันครบกำหนด";
    }
    if (formData.status === "paid" && !formData.paid_date) {
      errors.paid_date = "กรุณาเลือกวันที่ชำระ";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add new states for delete functionality
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<RentPayment | null>(
    null
  );

  // Add handleDeleteClick function
  const handleDeleteClick = (payment: RentPayment) => {
    setPaymentToDelete(payment);
    setIsDeleteModalOpen(true);
  };

  // Add confirmDelete function
  const confirmDelete = async () => {
    if (paymentToDelete) {
      setIsDeleting(true);
      try {
        const result = await deletePaymentAction(paymentToDelete.id);
        if (result.success) {
          setNotification({
            message: "ลบรายการชำระเงินสำเร็จ",
            type: "success",
          });
          afterPaymentChange();
        } else {
          setNotification({
            message: result.message || "เกิดข้อผิดพลาดในการลบรายการชำระเงิน",
            type: "error",
          });
        }
      } catch (error: any) {
        console.error("Error deleting payment:", error);
        setNotification({
          message: `เกิดข้อผิดพลาดในการลบรายการชำระเงิน: ${error.message}`,
          type: "error",
        });
      } finally {
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
        setPaymentToDelete(null);
      }
    }
  };

  // Updated Filter payments based on selected filters including year and month
  const filteredPayments = useMemo(() => {
    let filtered = payments;

    // กรองตามคอนโด
    if (selectedCondoFilter) {
      filtered = filtered.filter(
        (p) => p.tenant?.condo_id === selectedCondoFilter
      );
    }

    // กรองตามผู้เช่า
    if (selectedTenantFilter) {
      filtered = filtered.filter(
        (p) => p.tenant_id === selectedTenantFilter
      );
    }

    // กรองตามสถานะ
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === paymentStatusFilter);
    }

    // กรองตามปี
    if (selectedYearFilter) {
      filtered = filtered.filter((p) => {
        if (!p.due_date) return false;
        const paymentYear = new Date(p.due_date).getFullYear();
        return paymentYear === parseInt(selectedYearFilter);
      });
    }

    // กรองตามเดือน
    if (selectedMonthFilter) {
      filtered = filtered.filter((p) => {
        if (!p.due_date) return false;
        const paymentMonth = new Date(p.due_date).getMonth() + 1;
        return paymentMonth === parseInt(selectedMonthFilter);
      });
    }

    return filtered;
  }, [
    payments,
    selectedCondoFilter,
    selectedTenantFilter,
    paymentStatusFilter,
    selectedYearFilter,
    selectedMonthFilter,
  ]);

  // ฟังก์ชันล้างตัวกรองทั้งหมด
  const clearAllFilters = () => {
    setSelectedCondoFilter("");
    setSelectedTenantFilter("");
    setPaymentStatusFilter("all");
    setSelectedYearFilter("");
    setSelectedMonthFilter("");
  };

  const handleOpenCreateModal = () => {
    setFormData({
      tenant_id: "",
      amount: "",
      due_date: "",
      paid_date: "",
      status: "unpaid",
      notes: "",
    });
    setFormErrors({});
    setUploadedFiles([]);
    setIsCreatePaymentModalOpen(true);
  };

  const handleOpenEditModal = (payment: RentPayment) => {
    setSelectedPayment(payment);
    setFormData({
      ...formData,
      tenant_id: payment.tenant_id,
      amount: payment.amount.toString(),
      due_date: payment.due_date,
      paid_date: payment.paid_date || "",
      status: payment.status,
      notes: payment.notes || "",
    });
    setUploadedFiles([]); // Clear files for edit, user will re-upload if needed
    setIsEditPaymentModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submitting
    if (!validatePaymentForm()) {
      return;
    }

    setIsSaving(true);

    const paymentData = {
      tenant_id: formData.tenant_id,
      amount: Number.parseFloat(formData.amount),
      due_date: formData.due_date,
      paid_date: formData.paid_date || undefined,
      status: formData.status,
      notes: formData.notes || undefined,
    };

    try {
      let result;
      
      if (selectedPayment) {
        // Editing existing payment
        result = await updatePaymentAction(selectedPayment.id, paymentData);
      } else {
        // Creating new payment
        result = await createPaymentAction(paymentData);
      }

      if (result.success) {
        const savedPaymentId = selectedPayment ? selectedPayment.id : result.data?.id;

        // Handle file uploads if any
        if (uploadedFiles.length > 0 && savedPaymentId) {
          setIsUploading(true);
          // Need to fetch latest payment data to get condo_id/tenant_id if it was a new creation
          // But here we can use formData and the result
          
          // Note: Ideally we should use the returned data from server action, 
          // but for simplicity and since we have formData, we can proceed.
          // However, for condo_id we need it. 
          // Let's assume result.data contains the created record with tenant relation if possible,
          // but our action returns simple insert result.
          // We can use the tenant_id from formData to find condo_id from tenants list.
          
          const tenant = tenants.find(t => t.id === formData.tenant_id);
          const condoId = tenant?.condo_id || "";

          for (const file of uploadedFiles) {
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);
            uploadFormData.append("condoId", condoId);
            uploadFormData.append("documentType", "payment_receipt");
            uploadFormData.append("paymentId", savedPaymentId);
            uploadFormData.append("tenantId", formData.tenant_id);
            
            const uploadResult = await uploadDocument(uploadFormData);
            if (!uploadResult.success) {
              console.error("Error uploading file:", uploadResult.message);
              // Don't throw here to avoid rollback of payment creation, just warn
            }
          }
          setNotification({
            message: `บันทึกข้อมูลและ ${uploadedFiles.length} ไฟล์สำเร็จ`,
            type: "success",
          });
        } else {
          setNotification({ message: `บันทึกสำเร็จ`, type: "success" });
        }
        
        afterPaymentChange(); // Refresh data after save
      } else {
        setNotification({
          message: result.message || "เกิดข้อผิดพลาดในการบันทึกรายการชำระเงิน",
          type: "error",
        });
      }
    } catch (error: any) {
      console.error("Error saving payment record:", error);
      setNotification({
        message: `เกิดข้อผิดพลาดในการบันทึกรายการชำระเงิน: ${error.message}`,
        type: "error",
      });
    } finally {
      setIsSaving(false);
      setIsUploading(false);
      setIsCreatePaymentModalOpen(false);
      setIsEditPaymentModalOpen(false);
      setSelectedPayment(null);
      setUploadedFiles([]);
    }
  };

  const handleDocumentDelete = (
    docId: string,
    fileUrl: string,
    docName: string
  ) => {
    setRentDocToDelete({ id: docId, fileUrl, name: docName });
    setIsRentDocDeleteModalOpen(true);
  };

  const confirmRentDocDelete = async () => {
    if (!rentDocToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteDocumentAction(
        rentDocToDelete.id,
        rentDocToDelete.fileUrl || "" // บังคับส่ง string เสมอ
      );
      if (!result.success) {
        throw new Error(result.message);
      }
      setNotification({
        message: `เอกสาร "${rentDocToDelete.name}" ถูกลบแล้ว`,
        type: "success",
      });
      afterDocumentChange(); // รีเฟรชรายการเอกสารของ rent
    } catch (error: any) {
      console.error("Error deleting document:", error);
      setNotification({
        message: `เกิดข้อผิดพลาดในการลบเอกสาร: ${error.message}`,
        type: "error",
      });
    } finally {
      setIsDeleting(false);
      setIsRentDocDeleteModalOpen(false);
      setRentDocToDelete(null);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success-muted text-success";
      case "overdue":
        return "bg-destructive-muted text-destructive";
      default:
        return "bg-warning-muted text-warning";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <Check className="h-4 w-4" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "ชำระแล้ว";
      case "overdue":
        return "เกินกำหนด";
      default:
        return "ยังไม่ชำระ";
    }
  };

  const columns = [
    {
      key: "tenant_id",
      header: "ผู้เช่า",
      render: (payment: RentPayment) => {
        const tenant = payment.tenant;
        const condo = tenant?.condo;
        return (
          <div>
            <div className="font-medium">{tenant?.full_name || "ไม่ทราบ"}</div>
            <div className="text-sm text-muted-foreground">
              {condo ? `${condo.name} (${condo.room_number})` : "ไม่ทราบคอนโด"}
            </div>
          </div>
        );
      },
    },
    {
      key: "amount",
      header: "จำนวนเงิน",
      render: (payment: RentPayment) => `฿${payment.amount.toLocaleString()}`,
    },
    {
      key: "due_date",
      header: "วันครบกำหนด",
      render: (payment: RentPayment) => {
        const dueDate = new Date(payment.due_date);
        const today = new Date();
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        const isOverdue = dueDate < today && payment.status !== "paid";
        const isNearDue =
          daysDiff <= 7 && daysDiff > 0 && payment.status !== "paid";

        let textColor = "";
        if (isOverdue) {
          textColor = "text-destructive";
        } else if (isNearDue) {
          textColor = "text-warning";
        }

        return (
          <div className={textColor}>{dueDate.toLocaleDateString("th-TH")}</div>
        );
      },
    },
    {
      key: "paid_date",
      header: "วันที่ชำระ",
      render: (payment: RentPayment) =>
        payment.paid_date
          ? new Date(payment.paid_date).toLocaleDateString("th-TH")
          : "-",
    },
    {
      key: "notes",
      header: "หมายเหตุ",
      render: (payment: RentPayment) => (payment.notes ? payment.notes : "-"),
    },
    {
      key: "status",
      header: "สถานะ",
      render: (payment: RentPayment) => (
        <div className="flex items-center">
          <span
            className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              payment.status
            )}`}
          >
            {getStatusIcon(payment.status)}
            <span className="ml-1">{getStatusText(payment.status)}</span>
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "การดำเนินการ",
      render: (payment: RentPayment) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleOpenEditModal(payment)}
            className="text-info hover:text-info"
            title="แก้ไข"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(payment)}
            className="text-destructive hover:text-destructive"
            title="ลบ"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        // <div className="flex space-x-2">
        //   <button
        //     onClick={() => handleOpenEditModal(payment)}
        //     className="px-3 py-1 bg-info hover:bg-info/90 text-info-foreground text-xs rounded transition-colors"
        //     title="แก้ไขรายการ"
        //   >
        //     <Edit className="h-4 w-4 mr-1" />
        //     แก้ไข
        //   </button>
        //   {/* Add Delete Button */}
        //   <button
        //     onClick={() => handleDeleteClick(payment)}
        //     className="px-3 py-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs rounded transition-colors"
        //     title="ลบรายการ"
        //   >
        //     <Trash className="h-4 w-4 mr-1" />
        //     ลบ
        //   </button>
        // </div>
      ),
    },
  ];

  // Filter payments by status for summary cards
  const unpaidPaymentsCount = filteredPayments.filter(
    (p) => p.status === "unpaid"
  ).length;
  const overduePaymentsCount = filteredPayments.filter(
    (p) => p.status === "overdue"
  ).length;
  const paidPaymentsCount = filteredPayments.filter(
    (p) => p.status === "paid"
  ).length;

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Notification */}
        {notificationElement}

        <PageHeader
          title="จัดการค่าเช่า"
          description="ติดตามและจัดการการชำระค่าเช่า"
          icon={CreditCard}
          actions={
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center px-3 py-2 sm:px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm"
            >
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">เพิ่มรายการค่าเช่า</span>
              <span className="sm:hidden">เพิ่ม</span>
            </button>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <MetricCard label="ยังไม่ชำระ" value={unpaidPaymentsCount} icon={Clock} tone="warning" loading={loading} />
          <MetricCard
            label="เกินกำหนด"
            value={overduePaymentsCount}
            icon={AlertTriangle}
            tone="danger"
            loading={loading}
          />
          <MetricCard label="ชำระแล้ว" value={paidPaymentsCount} icon={Check} tone="success" loading={loading} />
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hidden sm:block" />

            {/* คอนโดฟิลเตอร์ */}
            <div className="flex items-center gap-1 sm:gap-2">
              <label className="text-xs sm:text-sm font-medium text-foreground" htmlFor="rent-f1">
                คอนโด:
              </label>
              <select id="rent-f1"
                value={selectedCondoFilter}
                onChange={(e) => {
                  setSelectedCondoFilter(e.target.value);
                  setSelectedTenantFilter(""); // Reset tenant filter when condo changes
                }}
                className="px-2 py-1 sm:px-3 bg-muted border border-input rounded text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring max-w-[100px] sm:max-w-none"
              >
                <option value="">ทั้งหมด</option>
                {condos.map((condo) => (
                  <option key={condo.id} value={condo.id}>
                    {condo.name} ({condo.room_number})
                  </option>
                ))}
              </select>
            </div>

            {/* ผู้เช่าฟิลเตอร์ */}
            <div className="flex items-center gap-1 sm:gap-2">
              <label className="text-xs sm:text-sm font-medium text-foreground" htmlFor="rent-f2">
                ผู้เช่า:
              </label>
              <select id="rent-f2"
                value={selectedTenantFilter}
                onChange={(e) => setSelectedTenantFilter(e.target.value)}
                disabled={!selectedCondoFilter}
                className={`px-2 py-1 sm:px-3 bg-muted border border-input rounded text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring max-w-[100px] sm:max-w-none ${!selectedCondoFilter ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="">{selectedCondoFilter ? 'ทั้งหมด' : 'เลือกคอนโดก่อน'}</option>
                {filteredTenantsForFilter.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* ปีฟิลเตอร์ */}
            <div>
              <label className="text-sm font-medium text-foreground mr-2" htmlFor="rent-f3">
                ปี:
              </label>
              <select id="rent-f3"
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className="px-3 py-1 bg-muted border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">ทั้งหมด</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year + 543} {/* แสดงปี พ.ศ. */}
                  </option>
                ))}
              </select>
            </div>

            {/* เดือนฟิลเตอร์ */}
            <div>
              <label className="text-sm font-medium text-foreground mr-2" htmlFor="rent-f4">
                เดือน:
              </label>
              <select id="rent-f4"
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="px-3 py-1 bg-muted border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">ทั้งหมด</option>
                {MONTHS_TH.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* สถานะฟิลเตอร์ */}
            <div>
              <label className="text-sm font-medium text-foreground mr-2" htmlFor="rent-f5">
                สถานะ:
              </label>
              <select id="rent-f5"
                value={paymentStatusFilter}
                onChange={(e) =>
                  setPaymentStatusFilter(
                    e.target.value as "all" | "unpaid" | "paid" | "overdue"
                  )
                }
                className="px-3 py-1 bg-muted border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">ทั้งหมด</option>
                <option value="unpaid">ยังไม่ชำระ</option>
                <option value="overdue">เกินกำหนด</option>
                <option value="paid">ชำระแล้ว</option>
              </select>
            </div>

            <span className="text-xs sm:text-sm text-muted-foreground w-full sm:w-auto">
              พบ {filteredPayments.length} รายการ
            </span>
          </div>
        </div>

        {/* Payments Table */}
        <DataTable
          data={filteredPayments}
          columns={columns}
          loading={loading}
          emptyMessage="ไม่พบรายการชำระค่าเช่า"
          itemsPerPage={12}
        />

        <Modal
          isOpen={isCreatePaymentModalOpen || isEditPaymentModalOpen}
          onClose={() => {
            setIsCreatePaymentModalOpen(false);
            setIsEditPaymentModalOpen(false);
            setSelectedPayment(null);
            setUploadedFiles([]);
          }}
          title={selectedPayment ? "แก้ไขรายการค่าเช่า" : "เพิ่มรายการค่าเช่า"}
          size="lg"
        >
          <form onSubmit={handleSavePayment} className="space-y-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${formErrors.tenant_id ? 'text-destructive' : 'text-foreground'}`} htmlFor="rent-f6">
                ผู้เช่า <span className="text-destructive">*</span>
              </label>
              <select id="rent-f6"
                value={formData.tenant_id}
                onChange={(e) => {
                  const selectedTenant = tenants.find(
                    (t) => t.id === e.target.value
                  );
                  setFormData({
                    ...formData,
                    tenant_id: e.target.value,
                    amount: selectedTenant?.monthly_rent.toString() || "",
                  });
                  if (formErrors.tenant_id) setFormErrors({ ...formErrors, tenant_id: undefined });
                }}
                className={fieldClass(!!formErrors.tenant_id)}
                disabled={!!selectedPayment}
              >
                <option value="">เลือกผู้เช่า</option>
                {tenants
                  .filter((t) => t.is_active || t.id === formData.tenant_id)
                  .map((tenant) => {
                    const condo = condos.find((c) => c.id === tenant.condo_id);
                    return (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.full_name} - {condo?.name} ({condo?.room_number}
                        ) - ฿{tenant.monthly_rent.toLocaleString()}
                      </option>
                    );
                  })}
              </select>
              {formErrors.tenant_id && (
                <div className="flex items-center mt-1 text-destructive text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {formErrors.tenant_id}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="rent-f7">
                  จำนวนเงิน (บาท) <span className="text-destructive">*</span>
                </label>
                <NumericFormat
                  thousandSeparator=","
                  decimalScale={2}
                  fixedDecimalScale={true}
                  allowNegative={false}
                  value={formData.amount}
                  onValueChange={(values) => {
                    setFormData({ ...formData, amount: values.value });
                    if (formErrors.amount) setFormErrors({ ...formErrors, amount: undefined });
                  }}
                  className={fieldClass(!!formErrors.amount)}
                  placeholder="0.00"
                />
                {formErrors.amount && (
                  <div className="flex items-center mt-1 text-destructive text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {formErrors.amount}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-foreground mb-1">
                  วันครบกำหนด <span className="text-destructive">*</span>
                </label>
                <DatePicker
                  id="due_date"
                  value={formData.due_date ? new Date(formData.due_date) : undefined}
                  onChange={(date) => {
                    const formattedDate = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
                    setFormData({ ...formData, due_date: formattedDate });
                    if (formErrors.due_date) setFormErrors({ ...formErrors, due_date: undefined });
                  }}
                  error={formErrors.due_date}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="rent-f7" className="block text-sm font-medium text-foreground mb-1">
                  สถานะ *
                </label>
                <select id="rent-f7"
                  required
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "unpaid" | "paid" | "overdue",
                    })
                  }
                  className={fieldClass()}
                >
                  <option value="unpaid">ยังไม่ชำระ</option>
                  <option value="paid">ชำระแล้ว</option>
                  <option value="overdue">เกินกำหนด</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="rent-f8">
                  วันที่ชำระ {formData.status === "paid" && <span className="text-destructive">*</span>}
                </label>
                <DatePicker
                  id="paid_date"
                  value={formData.paid_date ? new Date(formData.paid_date) : undefined}
                  onChange={(date) => {
                    const formattedDate = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
                    setFormData({ ...formData, paid_date: formattedDate });
                    if (formErrors.paid_date) setFormErrors({ ...formErrors, paid_date: undefined });
                  }}
                  error={formErrors.paid_date}
                  // Not strictly required unless status is paid, validation handles it
                />
              </div>
            </div>

            <ImageCompressInput
              files={uploadedFiles}
              onFilesChange={setUploadedFiles}
              label="แนบรูปภาพการจ่าย"
              accept="image/*,.pdf"
              maxSizeKB={100}
              disabled={isSaving || isUploading}
              showCompressInfo={true}
            />

            {selectedPayment && paymentDocuments.length > 0 && (
              <div>
                <DocumentPreview
                  documents={paymentDocuments}
                  documentTypes={PAYMENT_DOCUMENT_TYPES}
                  loading={paymentDocumentsLoading}
                  onDeleteDocument={handleDocumentDelete}
                  title="เอกสารที่แนบสำหรับรายการนี้"
                  maxColumns={2}
                />
              </div>
            )}

            <div>
              <label htmlFor="rent-f8" className="block text-sm font-medium text-foreground mb-1">
                หมายเหตุ
              </label>
              <textarea id="rent-f8"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full px-3 py-1.5 bg-muted border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
                placeholder="หมายเหตุเพิ่มเติม..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsCreatePaymentModalOpen(false);
                  setIsEditPaymentModalOpen(false);
                  setSelectedPayment(null);
                  setUploadedFiles([]);
                }}
                disabled={isSaving || isUploading}
                className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/90 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isSaving || isUploading}
              >
                {isSaving || isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isUploading ? "กำลังอัปโหลด..." : "กำลังบันทึก..."}
                  </>
                ) : (
                  "บันทึก"
                )}
              </button>
            </div>
          </form>
        </Modal>
        <ConfirmationModal
          isOpen={isRentDocDeleteModalOpen}
          onClose={() => {
            setIsRentDocDeleteModalOpen(false);
            setRentDocToDelete(null);
          }}
          onConfirm={confirmRentDocDelete}
          title="ยืนยันการลบเอกสาร"
          message={`คุณแน่ใจหรือไม่ว่าต้องการลบเอกสาร "${
            rentDocToDelete?.name || ""
          }"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
          confirmText="ยืนยัน"
          cancelText="ยกเลิก"
          type="danger"
          isLoading={isDeleting}
          loadingText="กำลังลบ..."
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="ยืนยันการลบรายการชำระเงิน"
          message={`คุณแน่ใจหรือไม่ว่าต้องการลบรายการชำระเงินของ ${
            paymentToDelete?.tenant?.full_name || "นี้"
          } จำนวน ฿${
            paymentToDelete?.amount.toLocaleString() || "N/A"
          }? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
          confirmText="ยืนยัน"
          cancelText="ยกเลิก"
          type="danger"
          isLoading={isDeleting}
          loadingText="กำลังลบ..."
        />
      </div>
    </MainLayout>
  );
}
