"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  condoService,
  tenantService,
  rentPaymentService,
  incomeService,
  expenseService,
  documentService,
  type GetOptions,
} from "../database";
import { supabase } from "@/lib/supabase";
import type {
  Condo,
  Tenant,
  RentPayment,
  IncomeRecord,
  ExpenseRecord,
  TenantHistory,
  NotificationSummary,
  Document,
} from "../supabase";

// ==================== Query Keys ====================
export const queryKeys = {
  condos: (userId?: string) => ["condos", userId] as const,
  tenants: (userId?: string) => ["tenants", userId] as const,
  payments: (userId?: string) => ["payments", userId] as const,
  incomeRecords: (userId?: string) => ["incomeRecords", userId] as const,
  expenseRecords: (userId?: string) => ["expenseRecords", userId] as const,
  financialRecords: (userId?: string) => ["financialRecords", userId] as const,
  tenantHistory: (userId?: string) => ["tenantHistory", userId] as const,
  notificationSummaries: (userId?: string) =>
    ["notificationSummaries", userId] as const,
  documents: (filters?: DocumentFilters) => ["documents", filters] as const,
  archivedTenant: (condoId?: string, fullName?: string) =>
    ["archivedTenant", condoId, fullName] as const,
};

// ==================== Fetch Functions ====================
async function fetchCondos(userId?: string): Promise<Condo[]> {
  if (!userId) return [];
  return await condoService.getByUserId(userId);
}

async function fetchTenants(userId?: string): Promise<Tenant[]> {
  if (!userId) return [];

  const { data: condos, error: condoError } = await supabase
    .from("condos")
    .select("id")
    .eq("user_id", userId);

  if (condoError) throw condoError;
  if (!condos || condos.length === 0) return [];

  const condoIds = condos.map((c) => c.id);

  const { data, error: tenantError } = await supabase
    .from("tenants")
    .select(`*, condo:condos(*)`)
    .in("condo_id", condoIds)
    .order("created_at", { ascending: false });

  if (tenantError) throw tenantError;
  return data || [];
}

async function fetchPayments(userId?: string): Promise<RentPayment[]> {
  if (!userId) return [];

  // Update overdue payments on load
  await rentPaymentService.updateOverduePayments();

  const allPayments = await rentPaymentService.getAll();

  const userCondos = await condoService.getByUserId(userId);
  const userCondoIds = userCondos.map((c) => c.id);
  return allPayments.filter(
    (p) => p.tenant?.condo_id && userCondoIds.includes(p.tenant.condo_id),
  );
}

async function fetchFinancialRecords(userId?: string): Promise<{
  incomeRecords: IncomeRecord[];
  expenseRecords: ExpenseRecord[];
}> {
  if (!userId) return { incomeRecords: [], expenseRecords: [] };

  const [allIncomeData, allExpenseData] = await Promise.all([
    incomeService.getAll(),
    expenseService.getAll(),
  ]);

  const userCondos = await condoService.getByUserId(userId);
  const userCondoIds = userCondos.map((c) => c.id);

  return {
    incomeRecords: allIncomeData.filter((r) =>
      userCondoIds.includes(r.condo_id),
    ),
    expenseRecords: allExpenseData.filter((r) =>
      userCondoIds.includes(r.condo_id),
    ),
  };
}

async function fetchTenantHistory(userId?: string): Promise<TenantHistory[]> {
  if (!userId) return [];

  const { data: condos, error: condoError } = await supabase
    .from("condos")
    .select("id")
    .eq("user_id", userId);

  if (condoError) throw condoError;
  if (!condos || condos.length === 0) return [];

  const condoIds = condos.map((c) => c.id);

  const { data, error: historyError } = await supabase
    .from("tenant_history")
    .select(`*, condo:condos(*)`)
    .in("condo_id", condoIds)
    .order("moved_out_at", { ascending: false });

  if (historyError) throw historyError;
  return data || [];
}

async function fetchNotificationSummaries(
  userId?: string,
): Promise<NotificationSummary[]> {
  if (!userId) return [];

  const { data, error: dbError } = await supabase
    .from("notification_summaries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (dbError) throw dbError;
  return data || [];
}

async function fetchDocuments({
  condoId,
  tenantId,
  paymentId,
  incomeId,
  expenseId,
  documentType,
  scope,
}: DocumentFilters): Promise<Document[]> {
  const opts: GetOptions = { documentType, scope };

  // Priority: income > expense > payment > condo > tenant
  if (incomeId) return await documentService.getByIncomeId(incomeId, opts);
  if (expenseId) return await documentService.getByExpenseId(expenseId, opts);
  if (paymentId) return await documentService.getByPaymentId(paymentId, opts);
  if (condoId) return await documentService.getByCondoId(condoId, opts);
  if (tenantId) return await documentService.getByTenantId(tenantId, opts);
  return [];
}

// ==================== Query Hooks ====================

/**
 * Hook สำหรับดึงข้อมูล Condos พร้อม caching
 * staleTime: 5 นาที (ข้อมูลเปลี่ยนไม่บ่อย)
 */
export function useCondos(userId?: string) {
  const query = useQuery({
    queryKey: queryKeys.condos(userId),
    queryFn: () => fetchCondos(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    condos: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

/**
 * Hook สำหรับดึงข้อมูล Tenants พร้อม caching
 * staleTime: 5 นาที (ข้อมูลเปลี่ยนไม่บ่อย)
 */
export function useTenants(userId?: string) {
  const query = useQuery({
    queryKey: queryKeys.tenants(userId),
    queryFn: () => fetchTenants(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    tenants: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

/**
 * Hook สำหรับดึงข้อมูล Rent Payments พร้อม caching
 * staleTime: 1 นาที (อาจมีการเปลี่ยนบ่อยกว่า)
 */
export function useRentPayments(userId?: string) {
  const query = useQuery({
    queryKey: queryKeys.payments(userId),
    queryFn: () => fetchPayments(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    payments: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

/**
 * Hook สำหรับดึงข้อมูล Financial Records พร้อม caching
 * staleTime: 2 นาที
 */
export function useFinancialRecords(userId?: string) {
  const query = useQuery({
    queryKey: queryKeys.financialRecords(userId),
    queryFn: () => fetchFinancialRecords(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    incomeRecords: query.data?.incomeRecords ?? [],
    expenseRecords: query.data?.expenseRecords ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

/**
 * Hook สำหรับดึงประวัติผู้เช่า พร้อม caching
 * staleTime: 5 นาที (ข้อมูลประวัติเปลี่ยนไม่บ่อย)
 */
export function useTenantHistory(userId?: string) {
  const query = useQuery({
    queryKey: queryKeys.tenantHistory(userId),
    queryFn: () => fetchTenantHistory(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    tenantHistory: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refresh: query.refetch,
  };
}

/**
 * Hook สำหรับดึง Notification Summaries พร้อม caching
 * staleTime: 30 วินาที (ต้องอัพเดทบ่อย)
 */
export function useNotifications(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.notificationSummaries(userId),
    queryFn: () => fetchNotificationSummaries(userId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });

  const markAsRead = async (summaryId: string) => {
    const { error } = await supabase
      .from("notification_summaries")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("id", summaryId);

    if (error) throw error;

    // Update cache optimistically
    queryClient.setQueryData(
      queryKeys.notificationSummaries(userId),
      (old: NotificationSummary[] | undefined) =>
        old?.map((s) => (s.id === summaryId ? { ...s, is_read: true } : s)),
    );
  };

  const markAllAsRead = async () => {
    if (!userId) return false;

    const { error: dbError } = await supabase
      .from("notification_summaries")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (dbError) throw dbError;

    // Refetch to ensure UI is updated
    await query.refetch();
    return true;
  };

  // Compute stats from summaries
  const summaries = query.data ?? [];
  const unreadCount = summaries.filter((s) => !s.is_read).length;
  const totalItems = summaries.reduce((sum, s) => sum + s.total_count, 0);

  return {
    summaries,
    notifications: summaries, // alias for backward compatibility
    loading: query.isLoading,
    error: query.error?.message ?? null,
    markAsRead,
    markAllAsRead,
    refetch: query.refetch,
    unreadCount,
    totalItems,
  };
}

export type DocumentFilters = {
  condoId?: string;
  tenantId?: string;
  paymentId?: string;
  incomeId?: string;
  expenseId?: string;
  documentType?: string;
  scope?: GetOptions["scope"];
};

/**
 * Hook สำหรับดึงเอกสารแนบ พร้อม caching
 * ใช้ query key เดียวกันทุกที่ที่ filters ตรงกัน → cache ไม่หลุดจากกัน
 * staleTime: 1 นาที
 */
export function useDocuments(filters: DocumentFilters = {}) {
  const { condoId, tenantId, paymentId, incomeId, expenseId } = filters;
  const hasTarget = !!(condoId || tenantId || paymentId || incomeId || expenseId);

  const query = useQuery({
    queryKey: queryKeys.documents(filters),
    queryFn: () => fetchDocuments(filters),
    enabled: hasTarget,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    documents: query.data ?? [],
    loading: hasTarget ? query.isLoading : false,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

/**
 * หา tenant record (is_active = false) ที่ตรงกับ history ที่เลือก
 * เพื่อใช้ดึงเอกสารของผู้เช่ารายนั้น
 */
export function useArchivedTenant(condoId?: string, fullName?: string) {
  const query = useQuery({
    queryKey: queryKeys.archivedTenant(condoId, fullName),
    queryFn: () =>
      condoId && fullName
        ? tenantService.getArchivedTenant(condoId, fullName)
        : null,
    enabled: !!(condoId && fullName),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    archivedTenant: query.data ?? null,
    loading: query.isLoading,
  };
}

// ==================== Invalidation ====================

/**
 * Cross-entity cache invalidation.
 *
 * tenants / payments / financialRecords / tenantHistory ทุกตัว derive scope
 * ของตัวเองจาก condos ของ user (userCondoIds) ดังนั้นการแก้ condo ต้อง
 * invalidate ทุก key ที่ derive จากมัน ไม่ใช่แค่ key ของ condos เอง
 *
 * ใช้ helper เหล่านี้หลังเรียก Server Action ทุกครั้ง แทนการ refetch เฉพาะ
 * query ของหน้าตัวเอง — กัน cache ของหน้าอื่นค้างเป็นข้อมูลเก่า
 */
export function useDataInvalidation(userId?: string) {
  const queryClient = useQueryClient();

  const invalidate = (...keys: readonly (readonly unknown[])[]) =>
    Promise.all(
      keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );

  return {
    /** condo เปลี่ยน → ทุก entity ที่ scope ตาม condo ต้องโหลดใหม่ */
    afterCondoChange: () =>
      invalidate(
        queryKeys.condos(userId),
        queryKeys.tenants(userId),
        queryKeys.payments(userId),
        queryKeys.financialRecords(userId),
        queryKeys.tenantHistory(userId),
      ),

    /** tenant เปลี่ยน → payments อ้าง tenant, history อาจได้ record ใหม่ */
    afterTenantChange: () =>
      invalidate(
        queryKeys.tenants(userId),
        queryKeys.payments(userId),
        queryKeys.tenantHistory(userId),
      ),

    /** payment เปลี่ยน → กระทบ dashboard/reports ที่อ่าน key เดียวกัน */
    afterPaymentChange: () => invalidate(queryKeys.payments(userId)),

    /** income/expense เปลี่ยน */
    afterFinancialChange: () => invalidate(queryKeys.financialRecords(userId)),

    /** เอกสารเปลี่ยน → invalidate ทุก filters (prefix match) */
    afterDocumentChange: () => invalidate(["documents"]),
  };
}
