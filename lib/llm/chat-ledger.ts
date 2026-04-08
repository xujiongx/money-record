import { z } from "zod";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/lib/ledger/categories";
import type { LedgerType, MemberRow } from "@/lib/ledger/types";

const ledgerIntentSchema = z.enum(["none", "collect", "ready"]);

export const ledgerSlotSchema = z.object({
  intent: ledgerIntentSchema,
  type: z.enum(["income", "expense"]).nullable(),
  member_id: z.string().nullable(),
  amount: z.number().nullable(),
  category: z.string().nullable(),
  note: z.string().nullable(),
  missing: z.array(z.string()),
});

export const ledgerChatResponseSchema = z.object({
  reply: z.string().min(1),
  ledger: ledgerSlotSchema,
});

export type LedgerChatResponse = z.infer<typeof ledgerChatResponseSchema>;

/** 从模型输出中取出 JSON 字符串（兼容偶发的 ```json 包裹） */
export function extractJsonFromModelContent(content: string): string {
  const t = content.trim();
  const fence = /```(?:json)?\s*([\s\S]*?)```/.exec(t);
  if (fence) return fence[1].trim();
  return t;
}

export function parseLedgerChatResponse(
  raw: string,
): { ok: true; data: LedgerChatResponse } | { ok: false; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(extractJsonFromModelContent(raw));
  } catch {
    return {
      ok: false,
      error: "小布这次回复格式异常，请点击「重试」或换一句话再说。",
    };
  }
  const parsed = ledgerChatResponseSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      error: "小布回复不完整，请点击「重试」或简化说法后再试。",
    };
  }
  return { ok: true, data: parsed.data };
}

export function buildLedgerChatSystemPrompt(members: MemberRow[]): string {
  const memberLines = members.map(
    (m) => `- id=${m.id} name=${m.name}`,
  );
  const expenseList = EXPENSE_CATEGORIES.join("、");
  const incomeList = INCOME_CATEGORIES.join("、");

  return `你是家庭记账应用里的助手「小布」。本轮你必须只输出一个 JSON 对象，不要 Markdown、不要代码块、不要前后解释文字。

JSON 结构（字段名必须一致）：
{
  "reply": "用户看到的自然语言全文，语气温暖简洁，可用少量 Markdown（**粗体**、列表）",
  "ledger": {
    "intent": "none" | "collect" | "ready",
    "type": "income" | "expense" | null,
    "member_id": "必须从下方成员列表选用的真实 id 字符串，或 null",
    "amount": 正数金额（元）或 null,
    "category": "分类名称字符串或 null",
    "note": "备注字符串或 null",
    "missing": ["member_id","amount","type","category"] 中仍缺项的键名数组，无缺则 []
  }
}

意图说明：
- intent=none：普通聊天、答疑，与记一笔账无关；ledger 里 type/member_id/amount/category 可全为 null，missing 为 []。
- intent=collect：用户想记账但信息不全；在 reply 里一次只追问 1～2 个最关键问题；missing 列出仍缺的键名（member_id 表示还不知道记在谁名下）。
- intent=ready：已根据**整段对话**收齐记账所需信息，且 missing 必须为 []；type、member_id、amount、category 均不得为 null（category 无法确定时用「其他」并在 note 里写明用户原话）。

记账判定：仅当用户明确在记录收支（如花了、买了、收款、工资到账等）时进入 collect/ready；含糊时可用 none 并一句确认是否要记账。

成员（member_id 只能填下列 id，禁止编造）：
${memberLines.length > 0 ? memberLines.join("\n") : "（暂无成员，若用户要记账请在 reply 中说明无法记账）"}

分类（category 必须严格等于下列某一词；对不上时用「其他」并把用户描述写进 note）：
- 支出 type=expense：${expenseList}
- 收入 type=income：${incomeList}

规则补充：
- 金额默认人民币元，正数；用户说「块」「元」同义。
- 用户只说「我」且对话里能推断成员时可填对应 member_id，否则 member_id 置 null 并在 missing 含 member_id。
- 不要编造未出现的金额或成员。`;
}

export type NormalizedLedgerPayload = {
  memberId: string;
  type: LedgerType;
  category: string;
  amount: number;
  note?: string;
};

/** ready 意图下将模型输出规范为可调用 createTransaction 的入参 */
export function normalizeReadyLedger(
  ledger: LedgerChatResponse["ledger"],
  validMemberIds: Set<string>,
):
  | { ok: true; payload: NormalizedLedgerPayload }
  | { ok: false; reason: string } {
  if (ledger.intent !== "ready") {
    return { ok: false, reason: "内部错误：非 ready" };
  }
  if (ledger.missing.length > 0) {
    return { ok: false, reason: "仍缺字段，不应执行记账" };
  }
  if (!ledger.type) {
    return { ok: false, reason: "缺少收支类型" };
  }
  if (!ledger.member_id || !validMemberIds.has(ledger.member_id)) {
    return { ok: false, reason: "成员无效或未选择" };
  }
  if (
    ledger.amount === null ||
    typeof ledger.amount !== "number" ||
    !Number.isFinite(ledger.amount) ||
    ledger.amount <= 0
  ) {
    return { ok: false, reason: "金额无效" };
  }

  const list =
    ledger.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const rawCat = ledger.category?.trim() ?? "";
  let category: string;
  let note = ledger.note?.trim() || undefined;

  if (rawCat && (list as readonly string[]).includes(rawCat)) {
    category = rawCat;
  } else {
    category = "其他";
    const extra =
      rawCat && !(list as readonly string[]).includes(rawCat)
        ? `自动录入：${rawCat}`
        : undefined;
    const merged = [note, extra].filter(Boolean).join("；");
    note = merged || undefined;
  }

  return {
    ok: true,
    payload: {
      memberId: ledger.member_id,
      type: ledger.type,
      category,
      amount: ledger.amount,
      note,
    },
  };
}
