import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { filterTransactionsInRange } from "@/lib/ledger/stats-period";
import type { LedgerType, TransactionRow } from "@/lib/ledger/types";

export type NamedAmount = {
  key: string;
  label: string;
  total: number;
};

/** 按金额降序取 Top N 流水（默认支出） */
export function topTransactionsByAmount(
  transactions: TransactionRow[],
  type: LedgerType,
  limit: number,
): TransactionRow[] {
  const take = Math.max(0, limit);
  return transactions
    .filter((t) => t.type === type)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, take);
}

/**
 * 周区间：按自然日汇总支出总额（周一～周日）。
 * 传入的 range 应为 getStatsDateRange("week") 的起止。
 */
export function weekdayExpenseSeries(
  transactions: TransactionRow[],
  rangeStart: Date,
  rangeEnd: Date,
): NamedAmount[] {
  const days = eachDayOfInterval({
    start: startOfDay(rangeStart),
    end: startOfDay(rangeEnd),
  });
  const byDay = new Map<string, NamedAmount>();
  for (const d of days) {
    const key = format(d, "yyyy-MM-dd");
    byDay.set(key, {
      key,
      label: format(d, "EEE", { locale: zhCN }),
      total: 0,
    });
  }
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const key = format(startOfDay(new Date(t.occurred_at)), "yyyy-MM-dd");
    const row = byDay.get(key);
    if (!row) continue;
    row.total += t.amount;
  }
  return days.map((d) => byDay.get(format(d, "yyyy-MM-dd"))!);
}

/** 年区间：1–12 月支出总额（不可点下钻；未来月也为 0） */
export function yearMonthExpenseSeries(
  transactions: TransactionRow[],
  yearAnchor: Date,
): NamedAmount[] {
  const year = yearAnchor.getFullYear();
  return Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(year, i, 1);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    let total = 0;
    for (const t of filterTransactionsInRange(transactions, start, end)) {
      if (t.type === "expense") total += t.amount;
    }
    return {
      key: format(monthDate, "yyyy-MM"),
      label: format(monthDate, "M月", { locale: zhCN }),
      total,
    };
  });
}

/** 分类 breakdown 按金额取前 N */
export function takeCategoryTop(
  rows: { name: string; value: number; count: number }[],
  limit: number,
): { name: string; value: number; count: number }[] {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  return sorted.slice(0, Math.max(0, limit));
}
