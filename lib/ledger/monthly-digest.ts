import {
  categoryBreakdown,
  memberPeriodBreakdown,
  summarizeLedger,
} from "@/lib/ledger/aggregates";
import { formatMoney } from "@/lib/ledger/format";
import { filterTransactionsInRange, getStatsDateRange } from "@/lib/ledger/stats-period";
import type { MemberRow, TransactionRow } from "@/lib/ledger/types";

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

/**
 * 与统计页「本月」一致：按 occurred_at 落在当月自然日；供小结与每轮对话中的「数据库事实」块复用。
 */
export function computeMonthlyLedgerDigest(
  all: TransactionRow[],
  members: MemberRow[],
  anchor: Date = new Date(),
): string {
  const range = getStatsDateRange("month", anchor);
  const month = `${range.start.getFullYear()}年${range.start.getMonth() + 1}月`;
  const inMonth = filterTransactionsInRange(all, range.start, range.end);
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

/**
 * 与统计页「本年」一致：`occurred_at` 落在当年自然日（`startOfYear`～`endOfYear`）。
 */
export function computeYearlyLedgerDigest(
  all: TransactionRow[],
  members: MemberRow[],
  anchor: Date = new Date(),
  categoryTop = 10,
): string {
  const range = getStatsDateRange("year", anchor);
  const year = `${range.start.getFullYear()}年`;
  const inYear = filterTransactionsInRange(all, range.start, range.end);
  const { income, expense, balance } = summarizeLedger(inYear);
  const expenseCats = categoryBreakdown(inYear, "expense");
  const incomeCats = categoryBreakdown(inYear, "income");
  const byMember = memberPeriodBreakdown(inYear, members);
  const memberLines = byMember.map(
    (r) =>
      `  - ${r.name}：收入 ${formatMoney(r.income)}（${r.incomeCount} 笔）、支出 ${formatMoney(r.expense)}（${r.expenseCount} 笔）`,
  );

  const lines = [
    `统计年份：${year}（按账单发生日期）`,
    `账单笔数：${inYear.length}`,
    `总收入：${formatMoney(income)}`,
    `总支出：${formatMoney(expense)}`,
    `结余：${formatMoney(balance)}`,
    "",
    "各成员本年（按记账人统计）：",
    memberLines.length > 0 ? memberLines.join("\n") : "  （暂无成员或暂无流水）",
    "",
    "支出分类（金额从高到低）：",
    expenseCats.length ? formatCategoryLines(expenseCats, categoryTop) : "  （本年无支出）",
    "",
    "收入分类（金额从高到低）：",
    incomeCats.length ? formatCategoryLines(incomeCats, categoryTop) : "  （本年无收入）",
  ];
  return lines.join("\n");
}
