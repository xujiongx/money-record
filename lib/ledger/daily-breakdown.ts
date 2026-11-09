import { eachDayOfInterval, format, startOfDay } from "date-fns";
import type { LedgerType, MemberRow, TransactionRow } from "@/lib/ledger/types";

export type DailyMemberSeriesPoint = {
  /** yyyy-MM-dd */
  dateKey: string;
  /** 轴标签，如 1日 */
  label: string;
  total: number;
  /** memberId → 当日该类型合计 */
  byMember: Record<string, number>;
};

/**
 * 按自然日汇总某一收/支类型的金额：总额 + 各成员。
 * 区间内无流水的日期仍保留为 0，便于折线连续。
 */
export function dailyMemberTypeSeries(
  transactions: TransactionRow[],
  members: MemberRow[],
  rangeStart: Date,
  rangeEnd: Date,
  type: LedgerType,
): DailyMemberSeriesPoint[] {
  const days = eachDayOfInterval({
    start: startOfDay(rangeStart),
    end: startOfDay(rangeEnd),
  });

  const emptyByMember = (): Record<string, number> => {
    const m: Record<string, number> = {};
    for (const mem of members) m[mem.id] = 0;
    return m;
  };

  const byDay = new Map<string, DailyMemberSeriesPoint>();
  for (const d of days) {
    const dateKey = format(d, "yyyy-MM-dd");
    byDay.set(dateKey, {
      dateKey,
      label: format(d, "d日"),
      total: 0,
      byMember: emptyByMember(),
    });
  }

  for (const t of transactions) {
    if (t.type !== type) continue;
    const dateKey = format(startOfDay(new Date(t.occurred_at)), "yyyy-MM-dd");
    const row = byDay.get(dateKey);
    if (!row) continue;
    row.total += t.amount;
    if (t.member_id in row.byMember) {
      row.byMember[t.member_id] =
        (row.byMember[t.member_id] ?? 0) + t.amount;
    }
  }

  return days.map((d) => byDay.get(format(d, "yyyy-MM-dd"))!);
}
