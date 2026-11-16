"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { seedLedgerCategoriesForHousehold } from "@/app/actions/ledger";
import { seedMajorEventCategoriesForHousehold } from "@/app/actions/major-events";
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
  revalidateTag("ledger", "max");
}

export type SetHouseholdSessionResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid" | "not_found" | "pending" | "unavailable" | "error";
      message: string;
      code?: string;
    };

export type CreateHouseholdResult =
  | { ok: true; pending: true; code: string }
  | {
      ok: false;
      reason: "invalid" | "pending_code" | "taken" | "error";
      message: string;
      code?: string;
    };

/**
 * 校验家庭编码是否存在，并写入 httpOnly Cookie（供 Server Actions / RSC 识别当前家庭）。
 * 客户端应在成功后自行写入 localStorage（见 EnterHouseholdCode）。
 * 审核中不抛错，返回 `reason: "pending"` 供登录页展示等待提示。
 */
export async function setHouseholdSession(
  raw: string,
): Promise<SetHouseholdSessionResult> {
  const code = normalizeHouseholdCode(raw);
  if (!code) {
    return {
      ok: false,
      reason: "invalid",
      message: "请输入完整的 6 位数字家庭编码",
    };
  }
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("households")
      .select("id, status")
      .eq("code", code)
      .maybeSingle();
    if (error) {
      return { ok: false, reason: "error", message: error.message, code };
    }
    if (!data) {
      return {
        ok: false,
        reason: "not_found",
        message: "找不到这个编码，请核对后重试",
        code,
      };
    }
    if (data.status === "pending") {
      return {
        ok: false,
        reason: "pending",
        message: "该家庭正在审核中",
        code,
      };
    }
    if (data.status !== "active") {
      return {
        ok: false,
        reason: "unavailable",
        message: "这个编码暂时不可用，请核对后重试",
        code,
      };
    }

    await writeHouseholdCookie(code);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      message: e instanceof Error ? e.message : "验证失败",
      code,
    };
  }
}

/**
 * 提交创建新家庭（名称 + 6 位数字编码），写入待审核状态，不自动登录。
 * 通过管理后台审核后，方可使用编码加入。
 */
export async function createHouseholdAndLogin(input: {
  name: string;
  codeRaw: string;
}): Promise<CreateHouseholdResult> {
  const code = normalizeHouseholdCode(input.codeRaw);
  if (!code) {
    return {
      ok: false,
      reason: "invalid",
      message: "请输入完整的 6 位数字家庭编码",
    };
  }
  const name = input.name.trim();
  if (!name) {
    return { ok: false, reason: "invalid", message: "请输入家庭名称" };
  }
  if (name.length > 60) {
    return {
      ok: false,
      reason: "invalid",
      message: "家庭名称请控制在 60 字以内",
    };
  }

  try {
    const supabase = createServiceClient();

    const { data: taken } = await supabase
      .from("households")
      .select("id, status")
      .eq("code", code)
      .maybeSingle();
    if (taken) {
      if (taken.status === "pending") {
        return {
          ok: false,
          reason: "pending_code",
          message: "该编码已有申请在审核中",
          code,
        };
      }
      return {
        ok: false,
        reason: "taken",
        message: "这个编码已被其他家庭使用，请换一个",
        code,
      };
    }

    const householdId = randomUUID();
    const { error: hErr } = await supabase.from("households").insert({
      id: householdId,
      name,
      code,
      status: "pending",
    });
    if (hErr) {
      if (hErr.code === "23505") {
        return {
          ok: false,
          reason: "taken",
          message: "这个编码已被其他家庭使用，请换一个",
          code,
        };
      }
      return { ok: false, reason: "error", message: hErr.message, code };
    }

    const { error: mErr } = await supabase.from("members").insert([
      { household_id: householdId, name: "布布", sort_order: 1 },
      { household_id: householdId, name: "一二", sort_order: 2 },
    ]);
    if (mErr) {
      await supabase.from("households").delete().eq("id", householdId);
      return { ok: false, reason: "error", message: mErr.message, code };
    }

    try {
      await Promise.all([
        seedMajorEventCategoriesForHousehold(householdId),
        seedLedgerCategoriesForHousehold(householdId),
      ]);
    } catch {
      await supabase.from("members").delete().eq("household_id", householdId);
      await supabase.from("households").delete().eq("id", householdId);
      return {
        ok: false,
        reason: "error",
        message: "创建申请提交失败，请稍后重试",
        code,
      };
    }

    return { ok: true, pending: true, code };
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      message: e instanceof Error ? e.message : "创建失败",
      code,
    };
  }
}

export async function clearHouseholdSession() {
  const jar = await cookies();
  jar.delete(HOUSEHOLD_CODE_COOKIE);
  revalidatePath("/", "layout");
  revalidatePath("/login");
  revalidateTag("ledger", "max");
}
