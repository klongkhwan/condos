"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PersonalFinanceRecord } from "@/lib/supabase";

export const personalFinanceKeys = {
  all: (userId?: string) => ["personal-finances", userId] as const,
  month: (userId?: string, month?: string) => ["personal-finances", "month", userId, month] as const,
};

export interface PersonalFinanceSummary {
  total_income: number;
  total_expense: number;
}

export interface PersonalFinancesResult {
  records: PersonalFinanceRecord[];
  summary: PersonalFinanceSummary;
}

async function fetchPersonalFinancesByMonth(userId: string, month: string): Promise<PersonalFinancesResult> {
  const startDate = `${month}-01`;
  const [year, m] = month.split('-');
  const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate();
  const endDate = `${month}-${lastDay}`;

  const { data, error } = await supabase.rpc("get_personal_finances_with_summary", {
    p_user_id: userId,
    p_start_date: startDate,
    p_end_date: endDate
  });

  if (error) throw error;
  
  // The RPC returns a JSON object containing "records" and "summary"
  return data as unknown as PersonalFinancesResult;
}

export function usePersonalFinancesByMonth(userId?: string, month?: string) {
  const query = useQuery({
    queryKey: personalFinanceKeys.month(userId, month),
    queryFn: () => {
      if (!userId || !month) return Promise.resolve({ records: [], summary: { total_income: 0, total_expense: 0 } } as PersonalFinancesResult);
      return fetchPersonalFinancesByMonth(userId, month);
    },
    enabled: !!userId && !!month,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    records: query.data?.records ?? [],
    summary: query.data?.summary ?? { total_income: 0, total_expense: 0 },
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
