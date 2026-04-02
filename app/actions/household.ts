"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import {
  HOUSEHOLD_CODE_COOKIE,
  normalizeHouseholdCode,
} from "@/lib/household";

async function writeHouseholdCookie(code: string) {
  const jar = await cookies();
  jar.set(HOUSEHOLD_CODE_COOKIE, code, {
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
  revalidatePath("/login");
}

/**
 * 校验家庭编码是否存在，并写入 httpOnly Cookie（供 Server Actions / RSC 识别当前家庭）。
 * 客户端应在成功后自行写入 localStorage（见 EnterHouseholdCode）。
 */
export async function setHouseholdSession(raw: string) {
  const code = normalizeHouseholdCode(raw);
  if (!code) {
    throw new Error("请输入 6 位数字家庭编码");
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("households")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("家庭编码不存在，请核对后重试");

  await writeHouseholdCookie(code);
}

/**
 * 创建新家庭（名称 + 6 位数字编码），并自动添加成员「布布」「一二」，随后登录该家庭。
 */
export async function createHouseholdAndLogin(input: {
  name: string;
  codeRaw: string;
}) {
  const code = normalizeHouseholdCode(input.codeRaw);
  if (!code) {
    throw new Error("请输入 6 位数字家庭编码");
  }
  const name = input.name.trim();
  if (!name) {
    throw new Error("请输入家庭名称");
  }
  if (name.length > 60) {
    throw new Error("家庭名称请控制在 60 字以内");
  }

  const supabase = createServiceClient();

  const { data: taken } = await supabase
    .from("households")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (taken) {
    throw new Error("该家庭编码已被使用，请换一个");
  }

  const householdId = randomUUID();
  const { error: hErr } = await supabase.from("households").insert({
    id: householdId,
    name,
    code,
  });
  if (hErr) {
    if (hErr.code === "23505") {
      throw new Error("该家庭编码已被使用，请换一个");
    }
    throw new Error(hErr.message);
  }

  const { error: mErr } = await supabase.from("members").insert([
    { household_id: householdId, name: "布布", sort_order: 1 },
    { household_id: householdId, name: "一二", sort_order: 2 },
  ]);
  if (mErr) {
    await supabase.from("households").delete().eq("id", householdId);
    throw new Error(mErr.message);
  }

  await writeHouseholdCookie(code);
}

export async function clearHouseholdSession() {
  const jar = await cookies();
  jar.delete(HOUSEHOLD_CODE_COOKIE);
  revalidatePath("/", "layout");
  revalidatePath("/login");
}
