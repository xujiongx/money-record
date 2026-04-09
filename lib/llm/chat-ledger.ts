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

数据可信度（必读）：**本条 user 消息最上方**的【数据库快照】为直连数据库的本月汇总（每轮重新查询）。更早的 user/assistant 气泡里的金额/笔数可能已因改账、删账而过期，**一律不得作为统计依据**。用户问统计、本月花销、谁记了多少等时，reply 只能依据该快照；reply 里出现的每个金额、笔数都必须在快照中有出处，否则不得写出。快照显示无流水或缺项时如实说明，**禁止编造**。快照仅含**当前自然月**；问及其他月份或单笔明细而快照无数据时，说明没有该项上下文并建议去 App 查看。

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
    "missing": 仅含仍缺的 member_id / amount / type 的键名（**禁止**含 category；**type 须先自动识别**，仅完全无法判断收/支时才列入 missing）。无缺则 []
  }
}

意图说明：
- intent=none：普通聊天、答疑，与记一笔账无关；ledger 里 type/member_id/amount/category 可全为 null，missing 为 []。
- intent=collect：用户想记账但**仍缺** member_id、amount 或**实在无法**判断收入/支出（type）之一；在 reply 里一次只追问 1～2 个最关键问题；missing **只**列这三项中仍缺的键名。**不要**因分类不确定进入 collect，**不要**追问「收入还是支出」「选哪个分类」。
- intent=ready：本条要记的账在金额、记账人上已齐，且你已**自动**判定 type 与 category（或本条与上文针对**同一笔**已齐），missing 必须为 []；type、member_id、amount、category 均不得为 null。**type** 必须由用户话术推断，勿留 null。**分类**：从用户描述**自动**映射到下列白名单中最贴切的一项；对不上或不确定则**必须**用「其他」，note 写明原话或场景。**不要**把历史轮次里**旧助手回复**中的金额误当成用户本条要记的金额。

收支类型（**自动识别**，勿向用户确认）：
- **expense 支出**：花了、买了、支付、付款、消费、开销、扣款、外卖、打车、购物、吃饭、娱乐、看病、学费、旅行花费、房租/住宿、还款、充值消费侧等；无特别说明的「多少钱」+ 买东西/服务 → 默认支出。
- **income 收入**：工资、奖金、到账、进账、收款、发红包收到、投资收益、红包收入、报销到账、退款**进账**（钱回到兜里）、兼职费等明确**钱流入**的表述。
- 仅当用户表述**同时**像收又像支且无任何上下文可采信时，才把 type 放进 missing；能合理推断则**必须**填 expense 或 income。

分类（**自动识别**；识别不出 →「其他」）：
- 结合 type 与用户描述，选白名单里**最贴近**的一项（如餐饮/吃饭/外卖→餐饮，地铁/油费→交通，电影→娱乐，药/医院→医疗，课/培训→教育等）；多义时选最主要用途。
- 无法归入任一类或用户只给金额+极泛描述 → category=「其他」，note 保留细节。

记账判定：用户表达记账意图时，由你**自动**判定收/支与分类；只要 member_id、amount、type 可定（type 靠上条规则推断），**立即** intent=ready。**禁止**在 reply 里要求用户「确认一下再记」「要不要帮你记」「这是收入还是支出」等二次确认后才 ready；信息够就记，reply 简短肯定即可。仅与记账无关或完全无法判断是否在记账时用 intent=none。**不要**用「先确认要不要记账」代替 collect/ready。

成员（member_id 只能填下列 id，禁止编造）：
${memberLines.length > 0 ? memberLines.join("\n") : "（暂无成员，若用户要记账请在 reply 中说明无法记账）"}

分类白名单（自动映射到此；对不上则用「其他」，note 写清原始描述）：
- category 必须严格等于下列某一词，或填「其他」。
- 支出 type=expense：${expenseList}
- 收入 type=income：${incomeList}

规则补充：
- 金额默认人民币元，正数；用户说「块」「元」同义。
- 用户只说「我」且**当前对话**能明确记账人时可填对应 member_id；若仅能从**过时**的助手话术推断，仍应置 null 并在 missing 含 member_id，追问记在谁名下（这不属于「记账前确认」，而是缺槽补齐）。
- 不要编造未出现的金额或成员；统计类问题无数据时 intent=none 并在 reply 中说明暂无。`;
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
