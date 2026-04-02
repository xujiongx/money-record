"use server";

import { revalidatePath } from "next/cache";
import { HOUSEHOLD_ID } from "@/lib/constants";
import { createServiceClient } from "@/lib/supabase/service";
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

export async function fetchMembers(): Promise<MemberRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("household_id", HOUSEHOLD_ID)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as MemberRow[];
}

export async function fetchTransactions(): Promise<TransactionRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, household_id, member_id, type, category, amount, note, occurred_at, members ( id, name )")
    .eq("household_id", HOUSEHOLD_ID)
    .order("occurred_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapTransaction(row as Parameters<typeof mapTransaction>[0]));
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
  const supabase = createServiceClient();
  const { error } = await supabase.from("transactions").insert({
    household_id: HOUSEHOLD_ID,
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

export async function deleteTransaction(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("household_id", HOUSEHOLD_ID);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/members");
}
