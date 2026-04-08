"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { requireHouseholdId } from "@/app/actions/ledger";

/** 单次从数据库拉取的最大条数（user+assistant 各算一条） */
const CHAT_FETCH_LIMIT = 300;

export type ChatMessagePersisted = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function toActionError(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** 按当前 Cookie 家庭拉取历史消息（时间正序，最多最近 CHAT_FETCH_LIMIT 条） */
export async function fetchChatMessagesAction(): Promise<
  | { ok: true; data: ChatMessagePersisted[] }
  | { ok: false; error: string }
> {
  try {
    const householdId = await requireHouseholdId();
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(CHAT_FETCH_LIMIT);
    if (error) {
      return { ok: false, error: error.message };
    }
    const rows = (data ?? []) as ChatMessagePersisted[];
    return { ok: true, data: rows.slice().reverse() };
  } catch (e) {
    return { ok: false, error: toActionError(e) };
  }
}

/**
 * 落库一轮问答（先 user 后 assistant）。失败不抛错，由客户端决定是否提示。
 */
export async function persistChatExchangeAction(
  userContent: string,
  assistantContent: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const u = userContent.trim();
    const a = assistantContent.trim();
    if (!u || !a) {
      return { ok: false, error: "用户与助手内容均不能为空" };
    }
    const householdId = await requireHouseholdId();
    const supabase = createServiceClient();
    const { error: e1 } = await supabase.from("chat_messages").insert({
      household_id: householdId,
      role: "user",
      content: u,
    });
    if (e1) return { ok: false, error: e1.message };
    const { error: e2 } = await supabase.from("chat_messages").insert({
      household_id: householdId,
      role: "assistant",
      content: a,
    });
    if (e2) return { ok: false, error: e2.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: toActionError(e) };
  }
}
