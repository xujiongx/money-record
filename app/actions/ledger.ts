"use server";

import { cache as cacheReact } from "react";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import {
  HOUSEHOLD_CODE_COOKIE,
  normalizeHouseholdCode,
} from "@/lib/household";
import {
  DEFAULT_LEDGER_CATEGORY,
  categoryNamesForType,
  defaultCategoryNames,
  normalizeLedgerCategoryName,
  type LedgerCategoryRow,
} from "@/lib/ledger/categories";
import type { LedgerType, MemberRow, TransactionRow } from "@/lib/ledger/types";
import { parseAmount } from "@/lib/ledger/types";

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

async function loadHouseholdIdByNormalizedCode(code: string): Promise<string> {
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

/** 跨请求复用「编码 → household_id」，与成员/流水缓存同属 `ledger` 标签 */
const getCachedHouseholdId = unstable_cache(
  async (code: string) => loadHouseholdIdByNormalizedCode(code),
  ["ledger-household-id-by-code"],
  { revalidate: 3600, tags: ["ledger"] },
);

/**
 * 同一次 RSC 请求内去重（React `cache()`）；跨 Tab 导航则命中 `getCachedHouseholdId` 的 `unstable_cache`。
 */
export const requireHouseholdId = cacheReact(async (): Promise<string> => {
  const jar = await cookies();
  const raw = jar.get(HOUSEHOLD_CODE_COOKIE)?.value ?? "";
  const code = normalizeHouseholdCode(raw);
  if (!code) {
    throw new Error("请先输入家庭编码");
  }
  return getCachedHouseholdId(code);
});

async function loadMembersForHousehold(
  householdId: string,
): Promise<MemberRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("household_id", householdId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as MemberRow[];
}

const getCachedMembers = unstable_cache(
  async (householdId: string) => loadMembersForHousehold(householdId),
  ["ledger-members"],
  { revalidate: 3600, tags: ["ledger"] },
);

async function loadTransactionsForHousehold(
  householdId: string,
): Promise<TransactionRow[]> {
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

const getCachedTransactions = unstable_cache(
  async (householdId: string) => loadTransactionsForHousehold(householdId),
  ["ledger-transactions"],
  { revalidate: 3600, tags: ["ledger"] },
);

export async function fetchMembers(): Promise<MemberRow[]> {
  const householdId = await requireHouseholdId();
  return getCachedMembers(householdId);
}

export async function fetchTransactions(): Promise<TransactionRow[]> {
  const householdId = await requireHouseholdId();
  return getCachedTransactions(householdId);
}

/**
 * 小布对话、月度小结等需要与数据库**实时一致**的场景使用（绕过 `unstable_cache`）。
 * 页面列表/统计仍走 `fetchMembers` / `fetchTransactions` 以复用缓存。
 */
export async function fetchLedgerSnapshotData(): Promise<{
  members: MemberRow[];
  transactions: TransactionRow[];
}> {
  const householdId = await requireHouseholdId();
  const [members, transactions] = await Promise.all([
    loadMembersForHousehold(householdId),
    loadTransactionsForHousehold(householdId),
  ]);
  return { members, transactions };
}

/** 单成员全量流水（不分页），用于客户端搜索/筛选场景。校验成员属于当前家庭。 */
export async function fetchAllMemberTransactions(
  memberId: string,
): Promise<TransactionRow[]> {
  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();
  const { data: mem, error: memErr } = await supabase
    .from("members")
    .select("id")
    .eq("id", memberId)
    .eq("household_id", householdId)
    .maybeSingle();
  if (memErr) throw new Error(memErr.message);
  if (!mem) throw new Error("成员不存在");

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, household_id, member_id, type, category, amount, note, occurred_at, members ( id, name )",
    )
    .eq("household_id", householdId)
    .eq("member_id", memberId)
    .order("occurred_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapTransaction(row as Parameters<typeof mapTransaction>[0]),
  );
}

/** 单成员流水（分页，按发生时间倒序）。校验成员属于当前家庭。 */
export async function fetchMemberTransactionsPage(
  memberId: string,
  offset: number,
  limit: number,
): Promise<{ items: TransactionRow[]; hasMore: boolean }> {
  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();
  const { data: mem, error: memErr } = await supabase
    .from("members")
    .select("id")
    .eq("id", memberId)
    .eq("household_id", householdId)
    .maybeSingle();
  if (memErr) throw new Error(memErr.message);
  if (!mem) throw new Error("成员不存在");

  const take = Math.min(Math.max(limit, 1), 50);
  const want = take + 1;
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, household_id, member_id, type, category, amount, note, occurred_at, members ( id, name )",
    )
    .eq("household_id", householdId)
    .eq("member_id", memberId)
    .order("occurred_at", { ascending: false })
    .range(offset, offset + want - 1);
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((row) =>
    mapTransaction(row as Parameters<typeof mapTransaction>[0]),
  );
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return { items, hasMore };
}

function invalidateLedger() {
  revalidateTag("ledger", "max");
  revalidatePath("/");
  revalidatePath("/record");
  revalidatePath("/stats");
  revalidatePath("/members");
  revalidatePath("/members", "layout");
  revalidatePath("/members/settings");
  revalidatePath("/members/settings/categories");
}

async function loadLedgerCategoriesForHousehold(
  householdId: string,
): Promise<LedgerCategoryRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ledger_categories")
    .select("*")
    .eq("household_id", householdId)
    .order("type", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as LedgerCategoryRow[];
}

/** 若某类型尚无分类，写入默认清单（含「其他」） */
async function ensureLedgerCategories(
  householdId: string,
): Promise<LedgerCategoryRow[]> {
  let rows = await loadLedgerCategoriesForHousehold(householdId);
  const missingTypes: LedgerType[] = (["expense", "income"] as const).filter(
    (t) => !rows.some((r) => r.type === t),
  );
  if (missingTypes.length === 0) return rows;

  const supabase = createServiceClient();
  const inserts = missingTypes.flatMap((type) =>
    defaultCategoryNames(type).map((name, i) => ({
      household_id: householdId,
      type,
      name,
      sort_order: i,
    })),
  );
  const { error } = await supabase.from("ledger_categories").insert(inserts);
  if (error && error.code !== "23505") throw new Error(error.message);
  rows = await loadLedgerCategoriesForHousehold(householdId);
  return rows;
}

const getCachedLedgerCategories = unstable_cache(
  async (householdId: string) => ensureLedgerCategories(householdId),
  ["ledger-categories"],
  { revalidate: 3600, tags: ["ledger"] },
);

export async function fetchLedgerCategories(): Promise<LedgerCategoryRow[]> {
  const householdId = await requireHouseholdId();
  return getCachedLedgerCategories(householdId);
}

/** 创建家庭时写入默认收支分类 */
export async function seedLedgerCategoriesForHousehold(householdId: string) {
  const supabase = createServiceClient();
  const inserts = (["expense", "income"] as const).flatMap((type) =>
    defaultCategoryNames(type).map((name, i) => ({
      household_id: householdId,
      type,
      name,
      sort_order: i,
    })),
  );
  const { error } = await supabase.from("ledger_categories").insert(inserts);
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function createLedgerCategory(type: LedgerType, name: string) {
  const normalized = normalizeLedgerCategoryName(name);
  if (!normalized) throw new Error("请输入分类名称");
  if (normalized.length > 20) throw new Error("分类名称请控制在 20 字以内");
  if (type !== "income" && type !== "expense") {
    throw new Error("收支类型无效");
  }

  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();
  const { data: maxRow } = await supabase
    .from("ledger_categories")
    .select("sort_order")
    .eq("household_id", householdId)
    .eq("type", type)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("ledger_categories").insert({
    household_id: householdId,
    type,
    name: normalized,
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });
  if (error) {
    if (error.code === "23505") throw new Error("该分类已存在");
    throw new Error(error.message);
  }
  invalidateLedger();
}

export async function updateLedgerCategory(categoryId: string, name: string) {
  const normalized = normalizeLedgerCategoryName(name);
  if (!normalized) throw new Error("请输入分类名称");
  if (normalized.length > 20) throw new Error("分类名称请控制在 20 字以内");

  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();

  const { data: row, error: fetchErr } = await supabase
    .from("ledger_categories")
    .select("id, name, type")
    .eq("id", categoryId)
    .eq("household_id", householdId)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!row) throw new Error("分类不存在");
  if (row.name === normalized) return;

  const { error: updateErr } = await supabase
    .from("ledger_categories")
    .update({ name: normalized })
    .eq("id", categoryId)
    .eq("household_id", householdId);
  if (updateErr) {
    if (updateErr.code === "23505") throw new Error("该分类已存在");
    throw new Error(updateErr.message);
  }

  const { error: txErr } = await supabase
    .from("transactions")
    .update({ category: normalized })
    .eq("household_id", householdId)
    .eq("type", row.type)
    .eq("category", row.name);
  if (txErr) throw new Error(txErr.message);

  invalidateLedger();
}

export async function deleteLedgerCategory(categoryId: string) {
  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();

  const { data: row, error: fetchErr } = await supabase
    .from("ledger_categories")
    .select("id, name, type")
    .eq("id", categoryId)
    .eq("household_id", householdId)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!row) throw new Error("分类不存在");
  if (row.name === DEFAULT_LEDGER_CATEGORY) {
    throw new Error(`「${DEFAULT_LEDGER_CATEGORY}」为默认分类，不可删除`);
  }

  await ensureLedgerCategories(householdId);
  const categories = await loadLedgerCategoriesForHousehold(householdId);
  const fallback =
    categoryNamesForType(categories, row.type as LedgerType).find(
      (n) => n === DEFAULT_LEDGER_CATEGORY,
    ) ?? DEFAULT_LEDGER_CATEGORY;

  const { error: txErr } = await supabase
    .from("transactions")
    .update({ category: fallback })
    .eq("household_id", householdId)
    .eq("type", row.type)
    .eq("category", row.name);
  if (txErr) throw new Error(txErr.message);

  const { error: delErr } = await supabase
    .from("ledger_categories")
    .delete()
    .eq("id", categoryId)
    .eq("household_id", householdId);
  if (delErr) throw new Error(delErr.message);

  invalidateLedger();
}

/** 首页「刷新数据」：清掉账本读缓存，配合客户端 `router.refresh()` 重新查库渲染。 */
export async function refreshLedgerReadCache(): Promise<void> {
  await requireHouseholdId();
  invalidateLedger();
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
  invalidateLedger();
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
  invalidateLedger();
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
  revalidateTag("ledger", "max");
  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/members");
  revalidatePath("/members", "layout");
}
