import type { MemberRow } from "@/lib/ledger/types";
import type { MajorEventExpenseRow } from "@/lib/events/types";

export function summarizeEventExpenses(expenses: MajorEventExpenseRow[]) {
  let total = 0;
  for (const e of expenses) total += e.amount;
  return { total, count: expenses.length };
}

export function eventCategoryBreakdown(
  expenses: MajorEventExpenseRow[],
): { name: string; value: number; count: number }[] {
  const m = new Map<string, { value: number; count: number }>();
  for (const e of expenses) {
    const prev = m.get(e.category) ?? { value: 0, count: 0 };
    prev.value += e.amount;
    prev.count += 1;
    m.set(e.category, prev);
  }
  return Array.from(m.entries())
    .map(([name, { value, count }]) => ({ name, value, count }))
    .sort((a, b) => b.value - a.value);
}

export function eventMemberBreakdown(
  expenses: MajorEventExpenseRow[],
  members: MemberRow[],
): { memberId: string; name: string; total: number; count: number }[] {
  const rows = members.map((mem) => ({
    memberId: mem.id,
    name: mem.name,
    total: 0,
    count: 0,
  }));
  const byId = new Map(rows.map((r) => [r.memberId, r]));
  for (const e of expenses) {
    const r = byId.get(e.member_id);
    if (!r) continue;
    r.total += e.amount;
    r.count += 1;
  }
  return rows;
}
