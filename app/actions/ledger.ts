"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import {
  HOUSEHOLD_CODE_COOKIE,
  normalizeHouseholdCode,
} from "@/lib/household";
import type { LedgerType, MemberRow, TransactionRow } from "@/lib/types";
import { parseAmount } from "@/lib/types";

function normalizeMember(
  m: { id: string; name: string } | { id: string; name: string }[] | null,
): { id: string; name: string } | null {
  if (!m) return null;
  if (Array.isArray(m)) return m[0] ?? null;
  return m;
}

function mapTransaction(row: {
  id: string;
  household_id: string;
  member_id: string;
  type: LedgerType;
  category: string;
  amount: string | number;
  note: string | null;
  occurred_at: string;
  members: { id: string; name: string } | { id: string; name: string }[] | null;
}): TransactionRow {
  return {
    ...row,
    amount: parseAmount(row.amount),
    members: normalizeMember(row.members),
  };
}

async function requireHouseholdId(): Promise<string> {
  const jar = await cookies();
  const raw = jar.get(HOUSEHOLD_CODE_COOKIE)?.value ?? "";
  const code = normalizeHouseholdCode(raw);
  if (!code) {
    throw new Error("请先输入家庭编码");
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("households")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("家庭编码已失效，请重新输入");
  return data.id;
}

export async function fetchMembers(): Promise<MemberRow[]> {
  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("household_id", householdId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as MemberRow[];
}

export async function fetchTransactions(): Promise<TransactionRow[]> {
  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, household_id, member_id, type, category, amount, note, occurred_at, members ( id, name )",
    )
    .eq("household_id", householdId)
    .order("occurred_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapTransaction(row as Parameters<typeof mapTransaction>[0]),
  );
}

export async function createTransaction(input: {
  memberId: string;
  type: LedgerType;
  category: string;
  amount: number;
  note?: string;
  occurredAt?: string;
}) {
  if (input.amount <= 0 || !Number.isFinite(input.amount)) {
    throw new Error("金额无效");
  }
  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();
  const { error } = await supabase.from("transactions").insert({
    household_id: householdId,
    member_id: input.memberId,
    type: input.type,
    category: input.category,
    amount: input.amount,
    note: input.note?.trim() || null,
    occurred_at: input.occurredAt ?? new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/record");
  revalidatePath("/stats");
  revalidatePath("/members");
}

export async function updateTransaction(
  id: string,
  input: {
    memberId: string;
    type: LedgerType;
    category: string;
    amount: number;
    note?: string;
    occurredAt: string;
  },
) {
  if (input.amount <= 0 || !Number.isFinite(input.amount)) {
    throw new Error("金额无效");
  }
  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      member_id: input.memberId,
      type: input.type,
      category: input.category,
      amount: input.amount,
      note: input.note?.trim() || null,
      occurred_at: input.occurredAt,
    })
    .eq("id", id)
    .eq("household_id", householdId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/record");
  revalidatePath("/stats");
  revalidatePath("/members");
}

export async function deleteTransaction(id: string) {
  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("household_id", householdId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/members");
}
