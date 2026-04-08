"use server";

import { fetchMembers, fetchTransactions } from "@/app/actions/ledger";
import {
  categoryBreakdown,
  memberPeriodBreakdown,
  summarizeLedger,
} from "@/lib/aggregates";
import { formatMoney } from "@/lib/format";
import {
  fetchUpstream,
  formatUpstreamDevDetail,
  isProxyConfigured,
  mistralConnectHint,
  readEnv,
  serializeFetchError,
} from "@/lib/mistral-fetch";
import { filterTransactionsInRange, getStatsDateRange } from "@/lib/stats-period";
import type { TransactionRow } from "@/lib/types";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

type ChatRole = "system" | "user" | "assistant";

export type MistralChatMessage = { role: "user" | "assistant"; content: string };

/** 用返回值表示失败，避免 Server Action throw 导致 POST 整页 500 */
export type MistralTextResult =
  | { ok: true; data: string }
  | { ok: false; error: string };

function toActionError(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function formatCategoryLines(
  rows: { name: string; value: number; count: number }[],
  top = 8,
): string {
  return rows
    .sort((a, b) => b.value - a.value)
    .slice(0, top)
    .map((r) => `  - ${r.name}：${formatMoney(r.value)}（${r.count} 笔）`)
    .join("\n");
}

/** 与统计页「本月」一致：按 occurred_at 落在当月自然日；含各成员收支供小结点评 */
export async function buildMonthlyLedgerDigest(): Promise<string> {
  const [all, members] = await Promise.all([
    fetchTransactions(),
    fetchMembers(),
  ]);
  const anchor = new Date();
  const range = getStatsDateRange("month", anchor);
  const month = `${range.start.getFullYear()}年${range.start.getMonth() + 1}月`;
  const inMonth = filterTransactionsInRange(
    all as TransactionRow[],
    range.start,
    range.end,
  );
  const { income, expense, balance } = summarizeLedger(inMonth);
  const expenseCats = categoryBreakdown(inMonth, "expense");
  const incomeCats = categoryBreakdown(inMonth, "income");
  const byMember = memberPeriodBreakdown(inMonth, members);
  const memberLines = byMember.map(
    (r) =>
      `  - ${r.name}：收入 ${formatMoney(r.income)}（${r.incomeCount} 笔）、支出 ${formatMoney(r.expense)}（${r.expenseCount} 笔）`,
  );

  const lines = [
    `统计月份：${month}（按账单发生日期）`,
    `账单笔数：${inMonth.length}`,
    `总收入：${formatMoney(income)}`,
    `总支出：${formatMoney(expense)}`,
    `结余：${formatMoney(balance)}`,
    "",
    "各成员本月（按记账人统计）：",
    memberLines.length > 0 ? memberLines.join("\n") : "  （暂无成员或暂无流水）",
    "",
    "支出分类（金额从高到低）：",
    expenseCats.length ? formatCategoryLines(expenseCats) : "  （本月无支出）",
    "",
    "收入分类（金额从高到低）：",
    incomeCats.length ? formatCategoryLines(incomeCats) : "  （本月无收入）",
  ];
  return lines.join("\n");
}

async function callMistral(messages: { role: ChatRole; content: string }[]) {
  const key = readEnv("MISTRAL_API_KEY");
  if (!key) {
    throw new Error("未配置 MISTRAL_API_KEY，请在 .env.local 中设置");
  }
  const model = readEnv("MISTRAL_MODEL") ?? "mistral-small-latest";
  let res: Awaited<ReturnType<typeof fetchUpstream>>;
  try {
    res = await fetchUpstream(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2048,
        temperature: 0.6,
      }),
    });
  } catch (err) {
    const { message, cause, code } = serializeFetchError(err);
    const proxyUsed = isProxyConfigured();
    const hint = mistralConnectHint(proxyUsed);
    const dev = formatUpstreamDevDetail(cause, code);
    throw new Error(`${message}${dev} ${hint}`);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mistral 请求失败（${res.status}）：${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("模型未返回有效内容");
  return content;
}

const ASSISTANT_SYSTEM =
  "你是家庭记账应用里的助手「小布」，用简体中文、语气温暖简洁。回答与用户问题相关的内容；若涉及具体账单数字，以用户或系统提供的上下文为准，不要编造未给出的金额。";

/** 多轮对话：history 为已完成的 user/assistant 消息（不含当前这条） */
export async function mistralChatAction(
  history: MistralChatMessage[],
  userMessage: string,
): Promise<MistralTextResult> {
  try {
    const trimmed = userMessage.trim();
    if (!trimmed) return { ok: false, error: "消息不能为空" };
    const messages: { role: ChatRole; content: string }[] = [
      { role: "system", content: ASSISTANT_SYSTEM },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: trimmed },
    ];
    const data = await callMistral(messages);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: toActionError(e) };
  }
}

const MONTHLY_SUMMARY_SYSTEM =
  `${ASSISTANT_SYSTEM} 写月度小结时须结合摘要里的成员收支数据做点评，语气积极、不人身攻击；无数据则不臆测。`;

/** 根据本月账本摘要生成小结（合理提示词 + 数据在 user 里） */
export async function generateMonthlySummaryAction(): Promise<MistralTextResult> {
  try {
    const digest = await buildMonthlyLedgerDigest();
    const userPrompt = `以下是本家庭账本在「本月」的汇总数据（已按发生日期统计，货币单位与 App 一致）。请根据这些数据写一段「本月小结」：

${digest}

写作要求：
1. 用简体中文，语气亲切，像在给家人做月度回顾。
2. 开头先概括全家本月总收入、总支出与结余；再点出主要支出方向（若有分类数据）；收入结构可简要一提。
3. 摘要里「各成员本月」行的姓名即记账人。请对其中名为「一二」「布布」的两位各写一小段（先一二、后布布）；若某姓名未在摘要中出现则不要写该人、勿虚构成员。每段须含：①消费习惯（结合该成员本月支出金额、笔数及全家支出分类，点出特点，语气温和、避免说教）；②赚钱能力（结合该成员本月收入金额与笔数，鼓励式点评；收入为 0 或笔数为 0 时如实说明并鼓励，勿编造）。
4. 若某成员本月收入与支出均为 0 且收支笔数均为 0，直说「本月较少由 TA 记账或暂无流水」，不推测性格或能力。
5. 若本月全家几乎没有流水，整体说明「本月记录较少」并温和鼓励坚持记账，成员点评从简。
6. 全文约 280～480 字，分段清晰；不要使用 Markdown 标题符号（不要用 #）。
7. 所有金额、笔数、分类均以摘要为准，不要编造未出现的数据。`;

    const data = await callMistral([
      { role: "system", content: MONTHLY_SUMMARY_SYSTEM },
      { role: "user", content: userPrompt },
    ]);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: toActionError(e) };
  }
}
