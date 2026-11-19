"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SEC,
  SEED_ADMIN_PASSWORD,
  SEED_ADMIN_USERNAME,
} from "@/lib/admin/constants";
import { hashPassword, verifyPassword } from "@/lib/admin/password";
import {
  adminSessionExpiryUnix,
  decodeAdminSession,
  encodeAdminSession,
} from "@/lib/admin/session";

export type AdminHouseholdListRow = {
  id: string;
  name: string;
  code: string;
  created_at: string;
};

function toAdminError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e);
  if (
    (msg.includes("admin_users") || msg.includes("households")) &&
    (msg.includes("schema cache") ||
      msg.includes("does not exist") ||
      msg.includes("Could not find"))
  ) {
    return new Error(
      "数据库尚未升级管理/审核表，请在 Supabase SQL Editor 执行 supabase/migrations/008_admin_and_household_status.sql",
    );
  }
  return e instanceof Error ? e : new Error(msg);
}

async function ensureSeedAdmin() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("username", SEED_ADMIN_USERNAME)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return;
  const { error: insertError } = await supabase.from("admin_users").insert({
    username: SEED_ADMIN_USERNAME,
    password_hash: hashPassword(SEED_ADMIN_PASSWORD),
  });
  if (insertError && insertError.code !== "23505") {
    throw new Error(insertError.message);
  }
}

async function writeAdminCookie(token: string) {
  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, token, {
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SEC,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_SESSION_COOKIE);
  revalidatePath("/admin", "layout");
}

export async function requireAdminSession(): Promise<{
  adminId: string;
  username: string;
}> {
  const jar = await cookies();
  const raw = jar.get(ADMIN_SESSION_COOKIE)?.value ?? "";
  const payload = decodeAdminSession(raw);
  if (!payload) {
    throw new Error("请先登录管理后台");
  }
  return { adminId: payload.adminId, username: payload.username };
}

export async function getAdminSession(): Promise<{
  adminId: string;
  username: string;
} | null> {
  try {
    return await requireAdminSession();
  } catch {
    return null;
  }
}

export async function adminLogin(input: {
  username: string;
  password: string;
}): Promise<void> {
  try {
    await ensureSeedAdmin();
    const username = input.username.trim();
    const password = input.password;
    if (!username || !password) {
      throw new Error("请输入账号和密码");
    }
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, username, password_hash")
      .eq("username", username)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || !verifyPassword(password, data.password_hash)) {
      throw new Error("账号或密码错误");
    }
    const token = encodeAdminSession({
      adminId: data.id,
      username: data.username,
      exp: adminSessionExpiryUnix(),
    });
    await writeAdminCookie(token);
    revalidatePath("/admin", "layout");
  } catch (e) {
    throw toAdminError(e);
  }
}

export async function fetchPendingHouseholds(): Promise<AdminHouseholdListRow[]> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("households")
      .select("id, name, code, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminHouseholdListRow[];
  } catch (e) {
    throw toAdminError(e);
  }
}

export async function fetchActiveHouseholds(): Promise<AdminHouseholdListRow[]> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("households")
      .select("id, name, code, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminHouseholdListRow[];
  } catch (e) {
    throw toAdminError(e);
  }
}

export async function approveHousehold(householdId: string): Promise<void> {
  try {
    await requireAdminSession();
    const id = householdId.trim();
    if (!id) throw new Error("无效的家庭");
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("households")
      .update({ status: "active" })
      .eq("id", id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("待审家庭不存在或已处理");
    revalidatePath("/admin");
    revalidatePath("/admin/ops");
  } catch (e) {
    throw toAdminError(e);
  }
}

/** 拒绝：删除家庭（级联成员/分类等），释放编码 */
export async function rejectHousehold(householdId: string): Promise<void> {
  try {
    await requireAdminSession();
    const id = householdId.trim();
    if (!id) throw new Error("无效的家庭");
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("households")
      .delete()
      .eq("id", id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("待审家庭不存在或已处理");
    revalidatePath("/admin");
    revalidatePath("/admin/ops");
  } catch (e) {
    throw toAdminError(e);
  }
}

export type AdminOpsSummary = {
  pendingCount: number;
  activeCount: number;
  createdLast7Days: number;
  monthIncome: number;
  monthExpense: number;
  monthTxnCount: number;
};

export type AdminOpsHouseholdRow = AdminHouseholdListRow & {
  status: "pending" | "active";
};

/** 运营概览：家庭计数 + 本月全站日常流水汇总 + 家庭列表 */
export async function fetchAdminOpsSummary(): Promise<{
  summary: AdminOpsSummary;
  households: AdminOpsHouseholdRow[];
}> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      pendingRes,
      activeRes,
      weekRes,
      householdsRes,
      txnRes,
    ] = await Promise.all([
      supabase
        .from("households")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("households")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("households")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString()),
      supabase
        .from("households")
        .select("id, name, code, created_at, status")
        .in("status", ["pending", "active"])
        .order("created_at", { ascending: false }),
      supabase
        .from("transactions")
        .select("amount, type")
        .gte("occurred_at", monthStart.toISOString()),
    ]);

    for (const r of [pendingRes, activeRes, weekRes, householdsRes, txnRes]) {
      if (r.error) throw new Error(r.error.message);
    }

    let monthIncome = 0;
    let monthExpense = 0;
    for (const row of txnRes.data ?? []) {
      const amount = Number(row.amount) || 0;
      if (row.type === "income") monthIncome += amount;
      else monthExpense += amount;
    }

    return {
      summary: {
        pendingCount: pendingRes.count ?? 0,
        activeCount: activeRes.count ?? 0,
        createdLast7Days: weekRes.count ?? 0,
        monthIncome,
        monthExpense,
        monthTxnCount: txnRes.data?.length ?? 0,
      },
      households: (householdsRes.data ?? []) as AdminOpsHouseholdRow[],
    };
  } catch (e) {
    throw toAdminError(e);
  }
}

export type AdminHouseholdDetail = {
  id: string;
  name: string;
  code: string;
  status: string;
  created_at: string;
};

export type AdminMemberRow = {
  id: string;
  name: string;
  sort_order: number;
};

export type AdminTxnRow = {
  id: string;
  type: string;
  category: string;
  amount: number;
  note: string | null;
  occurred_at: string;
  member_name: string | null;
};

/** 家庭详情：元数据 + 成员 */
export async function fetchAdminHouseholdDetail(
  householdId: string,
): Promise<{
  household: AdminHouseholdDetail;
  members: AdminMemberRow[];
}> {
  try {
    await requireAdminSession();
    const id = householdId.trim();
    if (!id) throw new Error("无效的家庭");
    const supabase = createServiceClient();
    const { data: household, error: hErr } = await supabase
      .from("households")
      .select("id, name, code, status, created_at")
      .eq("id", id)
      .maybeSingle();
    if (hErr) throw new Error(hErr.message);
    if (!household) throw new Error("家庭不存在");

    const { data: members, error: mErr } = await supabase
      .from("members")
      .select("id, name, sort_order")
      .eq("household_id", id)
      .order("sort_order", { ascending: true });
    if (mErr) throw new Error(mErr.message);

    return {
      household: household as AdminHouseholdDetail,
      members: (members ?? []) as AdminMemberRow[],
    };
  } catch (e) {
    throw toAdminError(e);
  }
}

const ADMIN_TXN_PAGE_SIZE = 50;

/** 家庭日常流水（只读分页） */
export async function fetchAdminHouseholdTransactions(
  householdId: string,
  page = 0,
): Promise<{ rows: AdminTxnRow[]; total: number; pageSize: number }> {
  try {
    await requireAdminSession();
    const id = householdId.trim();
    if (!id) throw new Error("无效的家庭");
    const offset = Math.max(0, page) * ADMIN_TXN_PAGE_SIZE;
    const supabase = createServiceClient();
    const { data, error, count } = await supabase
      .from("transactions")
      .select(
        "id, type, category, amount, note, occurred_at, members ( id, name )",
        { count: "exact" },
      )
      .eq("household_id", id)
      .order("occurred_at", { ascending: false })
      .range(offset, offset + ADMIN_TXN_PAGE_SIZE - 1);
    if (error) throw new Error(error.message);

    const rows: AdminTxnRow[] = (data ?? []).map((row) => {
      const mem = row.members as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null;
      const member = Array.isArray(mem) ? mem[0] : mem;
      return {
        id: row.id as string,
        type: row.type as string,
        category: row.category as string,
        amount: Number(row.amount) || 0,
        note: (row.note as string | null) ?? null,
        occurred_at: row.occurred_at as string,
        member_name: member?.name ?? null,
      };
    });

    return {
      rows,
      total: count ?? 0,
      pageSize: ADMIN_TXN_PAGE_SIZE,
    };
  } catch (e) {
    throw toAdminError(e);
  }
}

