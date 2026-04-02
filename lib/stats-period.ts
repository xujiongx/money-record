import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import type { TransactionRow } from "@/lib/types";

/** 中国习惯：周一开始 */
const WEEK_OPTS = { weekStartsOn: 1 as const };

export type StatsPeriod = "day" | "week" | "month" | "year";

/** 在当前锚点基础上前进/后退一个统计单位（日/周/月/年） */
export function shiftStatsAnchor(
  period: StatsPeriod,
  anchor: Date,
  delta: -1 | 1,
): Date {
  const forward = delta === 1;
  switch (period) {
    case "day":
      return forward ? addDays(anchor, 1) : subDays(anchor, 1);
    case "week":
      return forward ? addWeeks(anchor, 1) : subWeeks(anchor, 1);
    case "month":
      return forward ? addMonths(anchor, 1) : subMonths(anchor, 1);
    case "year":
      return forward ? addYears(anchor, 1) : subYears(anchor, 1);
    default: {
      const _: never = period;
      return _;
    }
  }
}

export function getStatsDateRange(
  period: StatsPeriod,
  anchor: Date = new Date(),
): { start: Date; end: Date } {
  switch (period) {
    case "day":
      return { start: startOfDay(anchor), end: endOfDay(anchor) };
    case "week":
      return {
        start: startOfWeek(anchor, WEEK_OPTS),
        end: endOfWeek(anchor, WEEK_OPTS),
      };
    case "month":
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
    case "year":
      return { start: startOfYear(anchor), end: endOfYear(anchor) };
    default: {
      const _: never = period;
      return _;
    }
  }
}

export function filterTransactionsInRange(
  transactions: TransactionRow[],
  start: Date,
  end: Date,
): TransactionRow[] {
  return transactions.filter((t) => {
    const d = new Date(t.occurred_at);
    return isWithinInterval(d, { start, end });
  });
}

/** 用于统计页副标题展示当前统计区间 */
export function formatStatsPeriodLabel(
  period: StatsPeriod,
  anchor: Date = new Date(),
): string {
  const { start, end } = getStatsDateRange(period, anchor);
  switch (period) {
    case "day":
      return format(anchor, "yyyy年M月d日", { locale: zhCN });
    case "week":
      return `${format(start, "M月d日", { locale: zhCN })}～${format(end, "M月d日", { locale: zhCN })}`;
    case "month":
      return format(anchor, "yyyy年M月", { locale: zhCN });
    case "year":
      return format(anchor, "yyyy年", { locale: zhCN });
    default: {
      const _: never = period;
      return _;
    }
  }
}
