import type { LedgerType, MemberRow, TransactionRow } from "@/lib/ledger/types";

export function summarizeLedger(transactions: TransactionRow[]) {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

export function sumByCategory(
  transactions: TransactionRow[],
  type: LedgerType,
): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== type) continue;
    m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
  }
  return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
}

/** 分类汇总：金额 + 笔数（用于统计明细） */
export function categoryBreakdown(
  transactions: TransactionRow[],
  type: LedgerType,
): { name: string; value: number; count: number }[] {
  const m = new Map<string, { value: number; count: number }>();
  for (const t of transactions) {
    if (t.type !== type) continue;
    const prev = m.get(t.category) ?? { value: 0, count: 0 };
    prev.value += t.amount;
    prev.count += 1;
    m.set(t.category, prev);
  }
  return Array.from(m.entries()).map(([name, { value, count }]) => ({
    name,
    value,
    count,
  }));
}

/** 当前时间范围内各成员收入/支出及笔数 */
export function memberPeriodBreakdown(
  transactions: TransactionRow[],
  members: MemberRow[],
): {
  memberId: string;
  name: string;
  expense: number;
  income: number;
  expenseCount: number;
  incomeCount: number;
}[] {
  const rows = members.map((mem) => ({
    memberId: mem.id,
    name: mem.name,
    expense: 0,
    income: 0,
    expenseCount: 0,
    incomeCount: 0,
  }));
  const byId = new Map(rows.map((r) => [r.memberId, r]));
  for (const t of transactions) {
    const r = byId.get(t.member_id);
    if (!r) continue;
    if (t.type === "expense") {
      r.expense += t.amount;
      r.expenseCount += 1;
    } else {
      r.income += t.amount;
      r.incomeCount += 1;
    }
  }
  return rows;
}

export function memberExpenseTotals(
  transactions: TransactionRow[],
  members: MemberRow[],
): { memberId: string; name: string; total: number }[] {
  const map = new Map<string, number>();
  for (const mem of members) map.set(mem.id, 0);
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    map.set(t.member_id, (map.get(t.member_id) ?? 0) + t.amount);
  }
  return members.map((mem) => ({
    memberId: mem.id,
    name: mem.name,
    total: map.get(mem.id) ?? 0,
  }));
}

export function memberStats(
  transactions: TransactionRow[],
  members: MemberRow[],
) {
  return members.map((mem) => {
    const mine = transactions.filter((t) => t.member_id === mem.id);
    let income = 0;
    let expense = 0;
    for (const t of mine) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return {
      member: mem,
      count: mine.length,
      income,
      expense,
    };
  });
}
