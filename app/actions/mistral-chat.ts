"use server";

import {
  createTransaction,
  fetchLedgerSnapshotData,
} from "@/app/actions/ledger";
import { computeMonthlyLedgerDigest } from "@/lib/ledger/monthly-digest";
import { xiaobuChatCompletion } from "@/lib/llm/xiaobu-llm";
import { format, getDaysInMonth } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  buildLedgerChatSystemPrompt,
  normalizeReadyLedger,
  parseLedgerChatResponse,
} from "@/lib/llm/chat-ledger";
type ChatRole = "system" | "user" | "assistant";

export type MistralChatMessage = { role: "user" | "assistant"; content: string };

/** 用返回值表示失败，避免 Server Action throw 导致 POST 整页 500 */
export type MistralTextResult =
  | { ok: true; data: string }
  | { ok: false; error: string };

function toActionError(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** 与统计页「本月」一致：直连数据库（不经列表读缓存）后计算摘要 */
export async function buildMonthlyLedgerDigest(): Promise<string> {
  const { transactions, members } = await fetchLedgerSnapshotData();
  return computeMonthlyLedgerDigest(transactions, members);
}

/** 系统提示中的短规则；具体数字放在本条 user 消息顶部的快照里 */
function buildLedgerTruthRulesForSystem(): string {
  return `【硬性规则 · 数据来源】
每轮**本条 user 消息**最上方的【数据库快照】来自服务端**刚执行的直连数据库查询**（不经页面列表用的读缓存）。凡涉及本月收入/支出/结余/笔数/分类/各成员汇总：
- reply 中出现的每一个具体数字（金额、笔数）必须能在该快照中逐项对应；**禁止**使用更早 user/assistant 气泡里的数字，**禁止**推测、举例虚构金额、或编造不存在的分类与记录。
- 快照写明「无支出」「无收入」「笔数为 0」等时，须**原样传达**，不可改成「大概」「一般会有」。
- 快照仅含**当前自然月**汇总；用户问其他月份或单笔明细而快照未给时，明确说当前没有该项数据，请去 App 查看。`;
}

/**
 * 把快照贴在用户原话之前，避免模型在长历史中采信过期的 assistant 数字。
 */
function wrapUserMessageWithLedgerSnapshot(
  digest: string,
  userMessage: string,
): string {
  const ts = new Date().toISOString();
  return `【数据库快照 · 权威 · 生成时间 ${ts}】
（本节为直连数据库汇总；与上文聊天记录冲突时**以本节为准**。）

${digest}

---
【用户原话】
${userMessage}`;
}

/** 供月度小结提示词：提问日未必是月底，需让模型按「本月进度」控制措辞 */
function buildMonthSummaryTimeContext(anchor: Date): string {
  const y = anchor.getFullYear();
  const mo = anchor.getMonth() + 1;
  const day = anchor.getDate();
  const daysInMonth = getDaysInMonth(anchor);
  const calendarPct = Math.min(
    100,
    Math.max(1, Math.round((day / daysInMonth) * 100)),
  );
  const todayStr = format(anchor, "yyyy年M月d日", { locale: zhCN });
  let phase: string;
  if (day <= 5) phase = "月初（本月刚开始不久）";
  else if (day <= 10) phase = "上旬";
  else if (day <= 20) phase = "中旬";
  else if (day <= daysInMonth - 3) phase = "下旬";
  else phase = "临近月末";

  return [
    `- 用户提问日：${todayStr}`,
    `- 统计自然月：${y}年${mo}月，全月共 ${daysInMonth} 天；当天是本月第 ${day} 天（日历进度约 ${calendarPct}%，仅表示时间，不代表消费节奏）。`,
    `- 时间阶段：${phase}。`,
    `- 摘要中的金额与笔数为「发生日落在此自然月、且已记在账里」的汇总；不是对未来的预测。`,
    `- 措辞约束：${day <= 10 ? "月初/上旬：开篇可用「本月伊始以来」「截至目前」等，避免「全月总结」「本月就这样了」；结尾鼓励继续记录，可提「后面大半个月还可观察」。" : day <= 20 ? "中旬：明确是「月中阶段性」小结，可提示「离月末还有一段，习惯仍可调整」。" : day <= daysInMonth - 3 ? "下旬：可说「进入本月后半」，仍避免断言整月已定型。" : "临近月末：可稍带回顾感，但若非最后一天，仍不要用「全月收官」；若恰为月末最后一天，才可略收紧为月度回顾语气。"}`,
  ].join("\n");
}

type CallXiaobuOptions = {
  temperature?: number;
  responseFormatJsonObject?: boolean;
};

async function callXiaobuLlm(
  messages: { role: ChatRole; content: string }[],
  options?: CallXiaobuOptions,
) {
  return xiaobuChatCompletion(messages, options);
}

const ASSISTANT_SYSTEM =
  "你是家庭记账应用里的助手「小布」，用简体中文、语气温暖简洁。回答与用户问题相关的内容。若系统在本轮消息中提供了账本/统计类事实块，凡涉金额、笔数、分类占比等**必须以该块（及当前用户消息）为准**；聊天历史里曾出现过的数字可能因用户事后改账而已错误，**不要沿用**。若无任何可信数据支撑（例如事实块显示无流水或用户未提供数字），据实说「暂无记录」或「当前没有该项数据」，**禁止推测、禁止编造示例金额**。回复可使用常见 Markdown（如 **粗体**、列表、`代码`、链接），便于阅读；避免滥用多级大标题。";

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
    const data = await callXiaobuLlm(messages);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: toActionError(e) };
  }
}

export type MistralLedgerChatResult =
  | { ok: true; reply: string; ledgerCreated?: boolean }
  | { ok: false; error: string };

/**
 * 多轮对话 + 结构化记账：模型仅返回 JSON（reply + ledger 槽位）；
 * intent=ready 且服务端校验通过时自动 createTransaction。
 */
export async function mistralLedgerChatAction(
  history: MistralChatMessage[],
  userMessage: string,
): Promise<MistralLedgerChatResult> {
  try {
    const trimmed = userMessage.trim();
    if (!trimmed) return { ok: false, error: "消息不能为空" };

    const { transactions: all, members } = await fetchLedgerSnapshotData();
    const digest = computeMonthlyLedgerDigest(all, members);
    const system = `${buildLedgerChatSystemPrompt(members)}\n\n${buildLedgerTruthRulesForSystem()}`;
    const userWithSnapshot = wrapUserMessageWithLedgerSnapshot(digest, trimmed);
    const messages: { role: ChatRole; content: string }[] = [
      { role: "system", content: system },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userWithSnapshot },
    ];

    const raw = await callXiaobuLlm(messages, {
      responseFormatJsonObject: true,
      temperature: 0.2,
    });

    const parsed = parseLedgerChatResponse(raw);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }

    const { reply, ledger } = parsed.data;
    const memberIdSet = new Set(members.map((m) => m.id));

    if (ledger.intent !== "ready") {
      return { ok: true, reply };
    }

    const normalized = normalizeReadyLedger(ledger, memberIdSet);
    if (!normalized.ok) {
      return {
        ok: true,
        reply: `${reply}\n\n（未写入账本：${normalized.reason}）`,
      };
    }

    try {
      await createTransaction({
        memberId: normalized.payload.memberId,
        type: normalized.payload.type,
        category: normalized.payload.category,
        amount: normalized.payload.amount,
        note: normalized.payload.note,
      });
      return { ok: true, reply, ledgerCreated: true };
    } catch (e) {
      const msg = toActionError(e);
      return {
        ok: true,
        reply: `${reply}\n\n保存失败：${msg}`,
      };
    }
  } catch (e) {
    return { ok: false, error: toActionError(e) };
  }
}

const MONTHLY_SUMMARY_SYSTEM =
  `${ASSISTANT_SYSTEM} 写月度小结时须结合摘要里的成员收支数据做点评，语气积极、不人身攻击；无数据则不臆测。须严格服从 user 里的「当前时间语境」：提问日可能是月初、月中或临近月末，不可一律按「整月已结束」来写。`;

/** 根据本月账本摘要生成小结（合理提示词 + 数据在 user 里） */
export async function generateMonthlySummaryAction(): Promise<MistralTextResult> {
  try {
    const now = new Date();
    const digest = await buildMonthlyLedgerDigest();
    const timeContext = buildMonthSummaryTimeContext(now);
    const userPrompt = `【当前时间语境（必须先读，并贯穿全文语气）】
${timeContext}

以下是本家庭账本在「本月」的汇总数据（按账单发生日落在此自然月；货币单位与 App 一致）。请根据数据与时间语境写一段小结——若尚处月初或月中，标题或开篇可点明「截至目前」「本月以来」等，避免写成「全月定稿」式总结。

${digest}

写作要求：
1. 用简体中文，语气亲切；开篇一两句应呼应「当前时间语境」（例如点出提问日或「本月第几天」带来的「阶段性」含义），不要假装已是月底封账。
2. 开头概括全家在本自然月内「截至目前」的总收入、总支出与结余（数据以摘要为准）；再点出主要支出方向（若有分类）；收入结构可简要一提。
3. 摘要里「各成员本月」行的姓名即记账人。请对其中名为「一二」「布布」的两位各写一小段（先一二、后布布）；若某姓名未在摘要中出现则不要写该人、勿虚构成员。每段须含：①消费习惯（结合该成员本月支出金额、笔数及全家支出分类，点出特点，语气温和、避免说教）；②赚钱能力（结合该成员本月收入金额与笔数，鼓励式点评；收入为 0 或笔数为 0 时如实说明并鼓励，勿编造）。
4. 若某成员本月收入与支出均为 0 且收支笔数均为 0，直说「本月较少由 TA 记账或暂无流水」，不推测性格或能力。
5. 若本月全家几乎没有流水，整体说明「本月记录较少」并温和鼓励坚持记账，成员点评从简。
6. 结尾根据进度收束：月初/中旬可鼓励「继续记、下旬再看」；临近月末可温和回顾但仍避免「本月再无变化」式绝对化表述（除非语境已说明是月末最后一天且你有意收口）。
7. 全文约 280～480 字，分段清晰；可使用 Markdown（**粗体**、列表、分段）增强可读性，少用一级「#」标题，必要时用二级「##」或加粗代替标题。
8. 所有金额、笔数、分类均以摘要为准，不要编造未出现的数据。`;

    const data = await callXiaobuLlm([
      { role: "system", content: MONTHLY_SUMMARY_SYSTEM },
      { role: "user", content: userPrompt },
    ]);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: toActionError(e) };
  }
}
