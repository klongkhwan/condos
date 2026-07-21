"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  success: boolean;
  message: string;
  data?: any;
};

export async function createPersonalFinanceAction(data: {
  user_id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  description?: string;
}): Promise<ActionResult> {
  try {
    const supabaseServer = await createSupabaseServerClient();
    const { data: record, error } = await supabaseServer
      .from("personal_finances")
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/personal-finance");
    return { success: true, message: "บันทึกข้อมูลสำเร็จ", data: record };
  } catch (error: any) {
    console.error("Error creating personal finance record:", error);
    return { success: false, message: error.message || "Failed to create record" };
  }
}

export async function updatePersonalFinanceAction(
  id: string,
  data: {
    type?: "income" | "expense";
    amount?: number;
    date?: string;
    description?: string;
  }
): Promise<ActionResult> {
  try {
    const supabaseServer = await createSupabaseServerClient();
    const { data: record, error } = await supabaseServer
      .from("personal_finances")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/personal-finance");
    return { success: true, message: "อัปเดตข้อมูลสำเร็จ", data: record };
  } catch (error: any) {
    console.error("Error updating personal finance record:", error);
    return { success: false, message: error.message || "Failed to update record" };
  }
}

export async function deletePersonalFinanceAction(id: string): Promise<ActionResult> {
  try {
    const supabaseServer = await createSupabaseServerClient();
    const { error } = await supabaseServer
      .from("personal_finances")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/personal-finance");
    return { success: true, message: "ลบข้อมูลสำเร็จ" };
  } catch (error: any) {
    console.error("Error deleting personal finance record:", error);
    return { success: false, message: error.message || "Failed to delete record" };
  }
}

export async function copyPersonalFinancesFromMonthAction(
  sourceMonth: string, // YYYY-MM
  targetMonth: string, // YYYY-MM
  userId: string
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    // 1. Fetch records from source month
    const sourceStartDate = `${sourceMonth}-01`;
    const [year, month] = sourceMonth.split('-');
    const lastDayOfSourceMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const sourceEndDate = `${sourceMonth}-${lastDayOfSourceMonth}`;

    const supabaseServer = await createSupabaseServerClient();
    const { data: sourceRecords, error: fetchError } = await supabaseServer
      .from("personal_finances")
      .select("*")
      .eq("user_id", userId)
      .gte("date", sourceStartDate)
      .lte("date", sourceEndDate);

    if (fetchError) throw fetchError;

    if (!sourceRecords || sourceRecords.length === 0) {
      return { success: false, message: "ไม่พบข้อมูลในเดือนก่อนหน้า" };
    }

    // 2. Map source records to target month
    const [targetYear, targetMonthStr] = targetMonth.split('-');
    const lastDayOfTargetMonth = new Date(parseInt(targetYear), parseInt(targetMonthStr), 0).getDate();

    const newRecords = sourceRecords.map((record) => {
      // Keep the same day if possible, or clamp to last day of target month
      const originalDate = new Date(record.date);
      const day = Math.min(originalDate.getDate(), lastDayOfTargetMonth);
      const newDateStr = `${targetMonth}-${String(day).padStart(2, '0')}`;

      return {
        user_id: userId,
        type: record.type,
        amount: record.amount,
        date: newDateStr,
        description: record.description,
      };
    });

    // 3. Insert new records
    const { error: insertError } = await supabaseServer
      .from("personal_finances")
      .insert(newRecords);

    if (insertError) throw insertError;

    revalidatePath("/personal-finance");
    return { success: true, message: "คัดลอกข้อมูลสำเร็จ", count: newRecords.length };
  } catch (error: any) {
    console.error("Error copying records:", error);
    return { success: false, message: error.message || "Failed to copy records" };
  }
}

export async function getYearlyPersonalFinanceSummaryAction(
  year: number,
  userId: string
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const supabaseServer = await createSupabaseServerClient();
    const { data: records, error } = await supabaseServer
      .from("personal_finances")
      .select("amount, type, date")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) throw error;

    // Group by month (1 to 12)
    const monthlySummary = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
      net: 0
    }));

    records?.forEach((record) => {
      const monthIndex = new Date(record.date).getMonth(); // 0-based
      if (record.type === "income") {
        monthlySummary[monthIndex].income += record.amount;
      } else if (record.type === "expense") {
        monthlySummary[monthIndex].expense += record.amount;
      }
      monthlySummary[monthIndex].net =
        monthlySummary[monthIndex].income - monthlySummary[monthIndex].expense;
    });

    return { success: true, data: monthlySummary };
  } catch (error: any) {
    console.error("Error fetching yearly summary:", error);
    return { success: false, message: error.message || "Failed to fetch yearly summary" };
  }
}

export async function getAvailablePersonalFinanceYearsAction(
  userId: string
): Promise<{ success: boolean; data?: number[]; message?: string }> {
  try {
    // Note: Supabase doesn't have a direct SELECT DISTINCT for a generated column via standard API.
    // The easiest robust way is to select dates and extract years in JS, 
    // or use a custom RPC if data is huge. Since personal finance data is usually small:
    const supabaseServer = await createSupabaseServerClient();
    const { data: records, error } = await supabaseServer
      .from("personal_finances")
      .select("date")
      .eq("user_id", userId);

    if (error) throw error;

    if (!records || records.length === 0) {
      return { success: true, data: [new Date().getFullYear()] };
    }

    const yearSet = new Set<number>();
    records.forEach(r => {
      if (r.date) {
        yearSet.add(new Date(r.date).getFullYear());
      }
    });

    const years = Array.from(yearSet).sort((a, b) => b - a); // Descending
    return { success: true, data: years };
  } catch (error: any) {
    console.error("Error fetching available years:", error);
    return { success: false, message: error.message || "Failed to fetch available years" };
  }
}
