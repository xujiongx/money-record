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

export type PendingHouseholdRow = {
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

export async function fetchPendingHouseholds(): Promise<PendingHouseholdRow[]> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("households")
      .select("id, name, code, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as PendingHouseholdRow[];
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
  } catch (e) {
    throw toAdminError(e);
  }
}

