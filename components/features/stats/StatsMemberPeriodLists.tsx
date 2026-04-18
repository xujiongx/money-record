import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { categoryBreakdown } from "@/lib/ledger/aggregates";
import { formatMoney } from "@/lib/ledger/format";
import type { LedgerType, TransactionRow } from "@/lib/ledger/types";

const COLORS = [
  "#fb923c",
  "#f472b6",
  "#fbbf24",
  "#a78bfa",
  "#34d399",
  "#60a5fa",
];

function formatPercent(part: number, total: number) {
  if (total <= 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function byOccurredDesc(a: TransactionRow, b: TransactionRow) {
  return new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
}

function CategoryGroupedList({
  rows,
  type,
  breakdown,
}: {
  rows: TransactionRow[];
  type: LedgerType;
  breakdown: { name: string; value: number; count: number }[];
}) {
  const tone: "expense" | "income" = type === "expense" ? "expense" : "income";
  const amountClass = tone === "expense" ? "text-rose-600" : "text-emerald-600";
  const prefix = tone === "expense" ? "-" : "+";

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-stone-500">
        {tone === "expense" ? "本区间暂无支出" : "本区间暂无收入"}
      </p>
    );
  }

  const totalAmount = breakdown.reduce((s, r) => s + r.value, 0);

  return (
    <div className="space-y-3">
      {breakdown.map((row, i) => {
        const catRows = rows
          .filter((t) => t.category === row.name)
          .sort(byOccurredDesc);
        return (
          <div
            key={row.name}
            className="overflow-hidden rounded-xl border border-stone-100 bg-stone-50/50"
          >
            <div className="flex items-start gap-2 border-b border-stone-100 bg-white/90 px-3 py-2.5">
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-stone-800">{row.name}</span>
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${amountClass}`}>
                    {prefix}
                    {formatMoney(row.value)}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  占{tone === "expense" ? "本区间个人总支出" : "本区间个人总收入"}的{" "}
                  {totalAmount > 0 ? formatPercent(row.value, totalAmount) : "0%"}
                  <span className="text-stone-300"> · </span>
                  {row.count} 笔
                  <span className="text-stone-300"> · </span>
                  笔均 {formatMoney(row.count > 0 ? row.value / row.count : 0)}
                </p>
              </div>
            </div>
            <ul className="divide-y divide-stone-100">
              {catRows.map((t) => (
                <li key={t.id} className="flex gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-stone-500">
                      {format(new Date(t.occurred_at), "M月d日 HH:mm", { locale: zhCN })}
                      {t.note ? ` · ${t.note}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${amountClass}`}>
                    {prefix}
                    {formatMoney(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function StatsMemberPeriodLists({
  householdCode,
  memberName,
  rangeBounds,
  expenses,
  incomes,
}: {
  householdCode: string;
  memberName: string;
  rangeBounds: string;
  expenses: TransactionRow[];
  incomes: TransactionRow[];
}) {
  const expenseTotal = expenses.reduce((s, t) => s + t.amount, 0);
  const incomeTotal = incomes.reduce((s, t) => s + t.amount, 0);
  const expenseBreakdown = categoryBreakdown(expenses, "expense").sort(
    (a, b) => b.value - a.value,
  );
  const incomeBreakdown = categoryBreakdown(incomes, "income").sort(
    (a, b) => b.value - a.value,
  );

  return (
    <div className="space-y-5">
      <header>
        <Link
          href="/stats"
          className="inline-flex items-center gap-1 text-sm font-medium text-white/90 transition hover:text-white"
        >
          <span aria-hidden>‹</span>
          返回统计
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-white drop-shadow-sm">
          {memberName} · 区间明细
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-white/85">{rangeBounds}</p>
        <p className="mt-1 font-mono text-[11px] text-white/75">家庭编码 {householdCode}</p>
      </header>

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <h2 className="text-sm font-semibold text-stone-800">支出</h2>
        <p className="mt-1 text-[11px] text-stone-500">
          {expenses.length} 笔 · 合计 {formatMoney(expenseTotal)}
          {expenseBreakdown.length > 0 && (
            <>
              <span className="text-stone-300"> · </span>
              {expenseBreakdown.length} 个分类
            </>
          )}
        </p>
        <p className="mt-2 text-[11px] font-medium text-stone-600">
          按分类占比与每笔明细（以记账时间为准）
        </p>
        <div className="mt-3">
          <CategoryGroupedList
            rows={expenses}
            type="expense"
            breakdown={expenseBreakdown}
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <h2 className="text-sm font-semibold text-stone-800">收入</h2>
        <p className="mt-1 text-[11px] text-stone-500">
          {incomes.length} 笔 · 合计 {formatMoney(incomeTotal)}
          {incomeBreakdown.length > 0 && (
            <>
              <span className="text-stone-300"> · </span>
              {incomeBreakdown.length} 个来源
            </>
          )}
        </p>
        <p className="mt-2 text-[11px] font-medium text-stone-600">
          按来源占比与每笔明细（以记账时间为准）
        </p>
        <div className="mt-3">
          <CategoryGroupedList
            rows={incomes}
            type="income"
            breakdown={incomeBreakdown}
          />
        </div>
      </section>
    </div>
  );
}
