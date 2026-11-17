import {
  eachDayOfInterval,
  eachHourOfInterval,
  eachMonthOfInterval,
  format,
  startOfDay,
  startOfHour,
  startOfMonth,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import type { LedgerType, MemberRow, TransactionRow } from "@/lib/ledger/types";

export type DailyMemberSeriesPoint = {
  /** 时：yyyy-MM-dd-HH；日：yyyy-MM-dd；月：yyyy-MM */
  dateKey: string;
  /** 轴标签，如 14时 / 1日 / 3月 */
  label: string;
  total: number;
  /** memberId → 该时段该类型合计 */
  byMember: Record<string, number>;
};

function emptyByMember(members: MemberRow[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const mem of members) m[mem.id] = 0;
  return m;
}

/**
 * 按整点小时汇总某一收/支类型的金额：总额 + 各成员。
 * 日区间用小时粒度，避免整天合成一个点看不出时段。
 */
export function hourlyMemberTypeSeries(
  transactions: TransactionRow[],
  members: MemberRow[],
  rangeStart: Date,
  rangeEnd: Date,
  type: LedgerType,
): DailyMemberSeriesPoint[] {
  const hours = eachHourOfInterval({
    start: startOfHour(rangeStart),
    end: startOfHour(rangeEnd),
  });

  const byHour = new Map<string, DailyMemberSeriesPoint>();
  for (const d of hours) {
    const dateKey = format(d, "yyyy-MM-dd-HH");
    byHour.set(dateKey, {
      dateKey,
      label: format(d, "H时"),
      total: 0,
      byMember: emptyByMember(members),
    });
  }

  for (const t of transactions) {
    if (t.type !== type) continue;
    const dateKey = format(startOfHour(new Date(t.occurred_at)), "yyyy-MM-dd-HH");
    const row = byHour.get(dateKey);
    if (!row) continue;
    row.total += t.amount;
    if (t.member_id in row.byMember) {
      row.byMember[t.member_id] =
        (row.byMember[t.member_id] ?? 0) + t.amount;
    }
  }

  return hours.map((d) => byHour.get(format(d, "yyyy-MM-dd-HH"))!);
}

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

  const byDay = new Map<string, DailyMemberSeriesPoint>();
  for (const d of days) {
    const dateKey = format(d, "yyyy-MM-dd");
    byDay.set(dateKey, {
      dateKey,
      label: format(d, "d日"),
      total: 0,
      byMember: emptyByMember(members),
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

/**
 * 按自然月汇总某一收/支类型的金额：总额 + 各成员。
 * 年区间用月粒度，避免 365 个日点把有数据的月份挤成「看起来全是 0」。
 */
export function monthlyMemberTypeSeries(
  transactions: TransactionRow[],
  members: MemberRow[],
  rangeStart: Date,
  rangeEnd: Date,
  type: LedgerType,
): DailyMemberSeriesPoint[] {
  const months = eachMonthOfInterval({
    start: startOfMonth(rangeStart),
    end: startOfMonth(rangeEnd),
  });

  const byMonth = new Map<string, DailyMemberSeriesPoint>();
  for (const d of months) {
    const dateKey = format(d, "yyyy-MM");
    byMonth.set(dateKey, {
      dateKey,
      label: format(d, "M月", { locale: zhCN }),
      total: 0,
      byMember: emptyByMember(members),
    });
  }

  for (const t of transactions) {
    if (t.type !== type) continue;
    const dateKey = format(new Date(t.occurred_at), "yyyy-MM");
    const row = byMonth.get(dateKey);
    if (!row) continue;
    row.total += t.amount;
    if (t.member_id in row.byMember) {
      row.byMember[t.member_id] =
        (row.byMember[t.member_id] ?? 0) + t.amount;
    }
  }

  return months.map((d) => byMonth.get(format(d, "yyyy-MM"))!);
}
