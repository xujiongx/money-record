import { getDate, getDaysInMonth } from "date-fns";
import { formatMoney } from "@/lib/ledger/format";

export type BudgetPaceTone = "calm" | "warn" | "over";

export type BudgetPaceInsight = {
  text: string;
  tone: BudgetPaceTone;
};

/**
 * 预算节奏洞察：有月预算时根据已花与日历进度生成一句可读判断。
 * 无有效预算金额时返回 null（由 UI 走空态，不硬编节奏）。
 */
export function computeBudgetPaceInsight(
  spent: number,
  amount: number,
  now: Date = new Date(),
): BudgetPaceInsight | null {
  const safeAmount = Math.max(0, amount);
  if (safeAmount <= 0) return null;

  const safeSpent = Math.max(0, spent);
  const day = getDate(now);
  const daysInMonth = getDaysInMonth(now);

  if (day === 1 && safeSpent === 0) {
    return { text: "新的一个月，按预算慢慢花", tone: "calm" };
  }

  if (safeSpent >= safeAmount) {
    return {
      text: `本月已超预算 ${formatMoney(safeSpent - safeAmount)}，记账不受影响`,
      tone: "over",
    };
  }

  const projected = (safeSpent / Math.max(day, 1)) * daysInMonth;
  if (projected > safeAmount) {
    return {
      text: `按现在速度，月底大约会超 ${formatMoney(projected - safeAmount)}`,
      tone: "warn",
    };
  }

  const daysLeft = Math.max(daysInMonth - day + 1, 1);
  const daily = (safeAmount - safeSpent) / daysLeft;
  return {
    text: `按剩余天数，往后每天大约还能花 ${formatMoney(daily)}`,
    tone: "calm",
  };
}
