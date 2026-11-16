import { format } from "date-fns";

/** 与首页/统计「自然月」一致的月键 */
export function monthPeriodKey(date: Date = new Date()): string {
  return format(date, "yyyy-MM");
}
