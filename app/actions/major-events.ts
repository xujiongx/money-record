"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireHouseholdId } from "@/app/actions/ledger";
import type {
  MajorEventCategoryRow,
  MajorEventExpenseRow,
  MajorEventListItem,
  MajorEventRow,
  MajorEventStatus,
} from "@/lib/events/types";
import { parseEventAmount } from "@/lib/events/types";
import {
  DEFAULT_MAJOR_EVENT_CATEGORY,
  normalizeMajorEventCategoryName,
} from "@/lib/events/categories";

function toMajorEventsError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e);
  const cause =
    e instanceof Error && e.cause instanceof Error ? e.cause.message : "";

  if (
    msg.includes("fetch failed") ||
    cause.includes("fetch failed") ||
    cause.includes("ECONNREFUSED") ||
    cause.includes("ENOTFOUND") ||
    cause.includes("ETIMEDOUT")
  ) {
    return new Error(
      "无法连接 Supabase。请检查 .env.local 中的 NEXT_PUBLIC_SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY 是否正确，Supabase 项目是否已暂停，以及本机网络/代理是否正常。",
    );
  }

  if (
    (msg.includes("major_events") || msg.includes("major_event_categories")) &&
    (msg.includes("schema cache") || msg.includes("does not exist"))
  ) {
    return new Error(
      "数据库尚未创建大事记账表，请在 Supabase SQL Editor 按序执行 supabase/migrations/004_major_events.sql 与 005_major_event_categories.sql",
    );
  }

  return e instanceof Error ? e : new Error(msg);
}

function normalizeMember(
  m: { id: string; name: string } | { id: string; name: string }[] | null,
): { id: string; name: string } | null {
  if (!m) return null;
  if (Array.isArray(m)) return m[0] ?? null;
  return m;
}

function mapExpense(row: {
  id: string;
  household_id: string;
  event_id: string;
  member_id: string;
  category: string;
  amount: string | number;
  note: string | null;
  occurred_at: string;
  members: { id: string; name: string } | { id: string; name: string }[] | null;
}): MajorEventExpenseRow {
  return {
    ...row,
    amount: parseEventAmount(row.amount),
    members: normalizeMember(row.members),
  };
}

function invalidateMajorEvents(eventId?: string) {
  revalidateTag("major-events", "max");
  revalidatePath("/tools");
  revalidatePath("/tools/events");
  revalidatePath("/tools/events/categories");
  if (eventId) {
    revalidatePath(`/tools/events/${eventId}`);
    revalidatePath(`/tools/events/${eventId}/analysis`);
  }
}

async function loadCategoriesForHousehold(
  householdId: string,
): Promise<MajorEventCategoryRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("major_event_categories")
    .select("*")
    .eq("household_id", householdId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as MajorEventCategoryRow[];
}

async function ensureDefaultCategories(
  householdId: string,
): Promise<MajorEventCategoryRow[]> {
  const existing = await loadCategoriesForHousehold(householdId);
  if (existing.length > 0) return existing;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("major_event_categories")
    .insert({
      household_id: householdId,
      name: DEFAULT_MAJOR_EVENT_CATEGORY,
      sort_order: 0,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return [data as MajorEventCategoryRow];
}

const getCachedCategories = unstable_cache(
  async (householdId: string) => ensureDefaultCategories(householdId),
  ["major-event-categories"],
  { revalidate: 3600, tags: ["major-events"] },
);

export async function fetchMajorEventCategories(): Promise<
  MajorEventCategoryRow[]
> {
  const householdId = await requireHouseholdId();
  return getCachedCategories(householdId);
}

/** 创建家庭时写入默认分类「其他」 */
export async function seedMajorEventCategoriesForHousehold(
  householdId: string,
) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("major_event_categories").insert({
    household_id: householdId,
    name: DEFAULT_MAJOR_EVENT_CATEGORY,
    sort_order: 0,
  });
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function createMajorEventCategory(name: string) {
  const normalized = normalizeMajorEventCategoryName(name);
  if (!normalized) throw new Error("请输入分类名称");
  if (normalized.length > 20) throw new Error("分类名称请控制在 20 字以内");

  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();
  const { data: maxRow } = await supabase
    .from("major_event_categories")
    .select("sort_order")
    .eq("household_id", householdId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("major_event_categories").insert({
    household_id: householdId,
    name: normalized,
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });
  if (error) {
    if (error.code === "23505") throw new Error("该分类已存在");
    throw new Error(error.message);
  }
  invalidateMajorEvents();
}

export async function updateMajorEventCategory(
  categoryId: string,
  name: string,
) {
  const normalized = normalizeMajorEventCategoryName(name);
  if (!normalized) throw new Error("请输入分类名称");
  if (normalized.length > 20) throw new Error("分类名称请控制在 20 字以内");

  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();

  const { data: row, error: fetchErr } = await supabase
    .from("major_event_categories")
    .select("id, name")
    .eq("id", categoryId)
    .eq("household_id", householdId)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!row) throw new Error("分类不存在");
  if (row.name === normalized) return;

  const { error: updateErr } = await supabase
    .from("major_event_categories")
    .update({ name: normalized })
    .eq("id", categoryId)
    .eq("household_id", householdId);
  if (updateErr) {
    if (updateErr.code === "23505") throw new Error("该分类已存在");
    throw new Error(updateErr.message);
  }

  const { error: expenseErr } = await supabase
    .from("major_event_expenses")
    .update({ category: normalized })
    .eq("household_id", householdId)
    .eq("category", row.name);
  if (expenseErr) throw new Error(expenseErr.message);

  invalidateMajorEvents();
}

export async function deleteMajorEventCategory(categoryId: string) {
  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();

  const { data: row, error: fetchErr } = await supabase
    .from("major_event_categories")
    .select("id, name")
    .eq("id", categoryId)
    .eq("household_id", householdId)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!row) throw new Error("分类不存在");
  if (row.name === DEFAULT_MAJOR_EVENT_CATEGORY) {
    throw new Error(`「${DEFAULT_MAJOR_EVENT_CATEGORY}」为默认分类，不可删除`);
  }

  const categories = await ensureDefaultCategories(householdId);
  const fallback =
    categories.find((c) => c.name === DEFAULT_MAJOR_EVENT_CATEGORY)?.name ??
    DEFAULT_MAJOR_EVENT_CATEGORY;

  const { error: expenseErr } = await supabase
    .from("major_event_expenses")
    .update({ category: fallback })
    .eq("household_id", householdId)
    .eq("category", row.name);
  if (expenseErr) throw new Error(expenseErr.message);

  const { error: deleteErr } = await supabase
    .from("major_event_categories")
    .delete()
    .eq("id", categoryId)
    .eq("household_id", householdId);
  if (deleteErr) throw new Error(deleteErr.message);

  invalidateMajorEvents();
}

async function assertCategoryAllowed(
  householdId: string,
  category: string,
) {
  const categories = await ensureDefaultCategories(householdId);
  const allowed = new Set(categories.map((c) => c.name));
  if (!allowed.has(category)) {
    throw new Error("请选择有效分类");
  }
}

async function loadEventsForHousehold(
  householdId: string,
): Promise<MajorEventListItem[]> {
  const supabase = createServiceClient();
  const { data: events, error } = await supabase
    .from("major_events")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (events ?? []) as MajorEventRow[];
  if (rows.length === 0) return [];

  const ids = rows.map((e) => e.id);
  const { data: expenseRows, error: expErr } = await supabase
    .from("major_event_expenses")
    .select("event_id, amount")
    .eq("household_id", householdId)
    .in("event_id", ids);
  if (expErr) throw new Error(expErr.message);

  const totals = new Map<string, { expense_total: number; expense_count: number }>();
  for (const id of ids) totals.set(id, { expense_total: 0, expense_count: 0 });
  for (const row of expenseRows ?? []) {
    const cur = totals.get(row.event_id);
    if (!cur) continue;
    cur.expense_total += parseEventAmount(row.amount);
    cur.expense_count += 1;
  }

  return rows.map((e) => ({
    ...e,
    expense_total: totals.get(e.id)?.expense_total ?? 0,
    expense_count: totals.get(e.id)?.expense_count ?? 0,
  }));
}

const getCachedEvents = unstable_cache(
  async (householdId: string) => loadEventsForHousehold(householdId),
  ["major-events-list"],
  { revalidate: 3600, tags: ["major-events"] },
);

async function loadEventById(
  householdId: string,
  eventId: string,
): Promise<MajorEventRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("major_events")
    .select("*")
    .eq("id", eventId)
    .eq("household_id", householdId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as MajorEventRow | null) ?? null;
}

async function loadExpensesForEvent(
  householdId: string,
  eventId: string,
): Promise<MajorEventExpenseRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("major_event_expenses")
    .select(
      "id, household_id, event_id, member_id, category, amount, note, occurred_at, members ( id, name )",
    )
    .eq("household_id", householdId)
    .eq("event_id", eventId)
    .order("occurred_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapExpense(row as Parameters<typeof mapExpense>[0]),
  );
}

const getCachedEventBundle = unstable_cache(
  async (householdId: string, eventId: string) => {
    const event = await loadEventById(householdId, eventId);
    if (!event) return null;
    const expenses = await loadExpensesForEvent(householdId, eventId);
    return { event, expenses };
  },
  ["major-event-bundle"],
  { revalidate: 3600, tags: ["major-events"] },
);

export async function fetchMajorEvents(): Promise<MajorEventListItem[]> {
  const householdId = await requireHouseholdId();
  return getCachedEvents(householdId);
}

export async function fetchMajorEventBundle(
  eventId: string,
): Promise<{ event: MajorEventRow; expenses: MajorEventExpenseRow[] } | null> {
  const householdId = await requireHouseholdId();
  return getCachedEventBundle(householdId, eventId);
}

export async function createMajorEvent(input: {
  title: string;
  note?: string;
  startedAt?: string;
}) {
  const title = input.title.trim();
  if (!title) throw new Error("请输入事项名称");
  const householdId = await requireHouseholdId();
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("major_events")
      .insert({
        household_id: householdId,
        title,
        note: input.note?.trim() || null,
        started_at: input.startedAt ?? new Date().toISOString(),
        status: "active" satisfies MajorEventStatus,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    invalidateMajorEvents(data.id);
    return data.id as string;
  } catch (e) {
    throw toMajorEventsError(e);
  }
}

export async function updateMajorEvent(
  eventId: string,
  input: {
    title: string;
    note?: string;
    status?: MajorEventStatus;
  },
) {
  const title = input.title.trim();
  if (!title) throw new Error("请输入事项名称");
  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("major_events")
    .update({
      title,
      note: input.note?.trim() || null,
      ...(input.status ? { status: input.status } : {}),
    })
    .eq("id", eventId)
    .eq("household_id", householdId);
  if (error) throw new Error(error.message);
  invalidateMajorEvents(eventId);
}

export async function deleteMajorEvent(eventId: string) {
  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("major_events")
    .delete()
    .eq("id", eventId)
    .eq("household_id", householdId);
  if (error) throw new Error(error.message);
  invalidateMajorEvents();
}

export async function createMajorEventExpense(input: {
  eventId: string;
  memberId: string;
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

  const { data: event, error: eventErr } = await supabase
    .from("major_events")
    .select("id")
    .eq("id", input.eventId)
    .eq("household_id", householdId)
    .maybeSingle();
  if (eventErr) throw new Error(eventErr.message);
  if (!event) throw new Error("事项不存在");

  const { data: mem, error: memErr } = await supabase
    .from("members")
    .select("id")
    .eq("id", input.memberId)
    .eq("household_id", householdId)
    .maybeSingle();
  if (memErr) throw new Error(memErr.message);
  if (!mem) throw new Error("成员不存在");

  const category = normalizeMajorEventCategoryName(input.category);
  await assertCategoryAllowed(householdId, category);

  const { error } = await supabase.from("major_event_expenses").insert({
    household_id: householdId,
    event_id: input.eventId,
    member_id: input.memberId,
    category,
    amount: input.amount,
    note: input.note?.trim() || null,
    occurred_at: input.occurredAt ?? new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  invalidateMajorEvents(input.eventId);
}

export async function deleteMajorEventExpense(
  expenseId: string,
  eventId: string,
) {
  const householdId = await requireHouseholdId();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("major_event_expenses")
    .delete()
    .eq("id", expenseId)
    .eq("household_id", householdId)
    .eq("event_id", eventId);
  if (error) throw new Error(error.message);
  invalidateMajorEvents(eventId);
}
