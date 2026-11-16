"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireHouseholdId } from "@/app/actions/ledger";
import { monthPeriodKey } from "@/lib/budget/period";
import type { BudgetRow } from "@/lib/budget/types";
import { parseAmount } from "@/lib/ledger/types";

function toBudgetError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e);
  if (
    msg.includes("budgets") &&
    (msg.includes("schema cache") ||
      msg.includes("does not exist") ||
      msg.includes("Could not find the table"))
  ) {
    return new Error(
      "数据库尚未创建预算表，请在 Supabase SQL Editor 执行 supabase/migrations/007_budgets.sql",
    );
  }
  return e instanceof Error ? e : new Error(msg);
}

function mapBudget(row: {
  id: string;
  household_id: string;
  period_type: "month";
  period_key: string;
  scope: "household" | "category";
  category: string | null;
  amount: string | number;
  created_at: string;
  updated_at: string;
}): BudgetRow {
  return {
    ...row,
    amount: parseAmount(row.amount),
  };
}

function invalidateBudgets() {
  revalidateTag("budgets", "max");
  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/tools");
  revalidatePath("/tools/budget");
}

async function loadHouseholdMonthBudget(
  householdId: string,
  periodKey: string,
): Promise<BudgetRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("household_id", householdId)
    .eq("period_type", "month")
    .eq("period_key", periodKey)
    .eq("scope", "household")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapBudget(data) : null;
}

const getCachedHouseholdMonthBudget = unstable_cache(
  async (householdId: string, periodKey: string) =>
    loadHouseholdMonthBudget(householdId, periodKey),
  ["budget-household-month"],
  { revalidate: 3600, tags: ["budgets"] },
);

/** 读取指定月（默认本月）的全家总预算；未设置返回 null */
export async function fetchHouseholdMonthBudget(
  periodKey?: string,
): Promise<BudgetRow | null> {
  try {
    const householdId = await requireHouseholdId();
    const key = periodKey ?? monthPeriodKey();
    return await getCachedHouseholdMonthBudget(householdId, key);
  } catch (e) {
    throw toBudgetError(e);
  }
}

/** 设置或更新本月全家总预算；amount 须 > 0 */
export async function upsertHouseholdMonthBudget(
  amount: number,
  periodKey?: string,
): Promise<BudgetRow> {
  try {
    const householdId = await requireHouseholdId();
    const key = periodKey ?? monthPeriodKey();
    if (!(amount > 0) || !Number.isFinite(amount)) {
      throw new Error("预算金额须大于 0");
    }
    const rounded = Math.round(amount * 100) / 100;
    const supabase = createServiceClient();
    const existing = await loadHouseholdMonthBudget(householdId, key);

    if (existing) {
      const { data, error } = await supabase
        .from("budgets")
        .update({
          amount: rounded,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      invalidateBudgets();
      return mapBudget(data);
    }

    const { data, error } = await supabase
      .from("budgets")
      .insert({
        household_id: householdId,
        period_type: "month",
        period_key: key,
        scope: "household",
        category: null,
        amount: rounded,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    invalidateBudgets();
    return mapBudget(data);
  } catch (e) {
    throw toBudgetError(e);
  }
}

/** 清空指定月（默认本月）全家总预算 */
export async function clearHouseholdMonthBudget(
  periodKey?: string,
): Promise<void> {
  try {
    const householdId = await requireHouseholdId();
    const key = periodKey ?? monthPeriodKey();
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("household_id", householdId)
      .eq("period_type", "month")
      .eq("period_key", key)
      .eq("scope", "household");
    if (error) throw new Error(error.message);
    invalidateBudgets();
  } catch (e) {
    throw toBudgetError(e);
  }
}
