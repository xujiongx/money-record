import type { LedgerType, MemberRow, TransactionRow } from "@/lib/types";

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
