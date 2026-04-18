import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { formatMoney } from "@/lib/ledger/format";
import type { TransactionRow } from "@/lib/ledger/types";

function TxRows({ rows, tone }: { rows: TransactionRow[]; tone: "expense" | "income" }) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-stone-500">本区间暂无记录</p>
    );
  }
  const amountClass = tone === "expense" ? "text-rose-600" : "text-emerald-600";
  const prefix = tone === "expense" ? "-" : "+";
  return (
    <ul className="divide-y divide-stone-100">
      {rows.map((t) => (
        <li key={t.id} className="flex gap-3 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  tone === "expense"
                    ? "rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800"
                    : "rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800"
                }
              >
                {tone === "expense" ? "支出" : "收入"}
              </span>
              <span className="text-sm font-semibold text-stone-800">{t.category}</span>
            </div>
            <p className="mt-1 text-[11px] text-stone-500">
              {format(new Date(t.occurred_at), "yyyy年M月d日 HH:mm", { locale: zhCN })}
              {t.note ? ` · ${t.note}` : ""}
            </p>
          </div>
          <span className={`shrink-0 text-sm font-bold tabular-nums ${amountClass}`}>
            {prefix}
            {formatMoney(t.amount)}
          </span>
        </li>
      ))}
    </ul>
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
        <h2 className="text-sm font-semibold text-stone-800">
          支出明细
          <span className="ml-2 font-normal text-stone-500">
            {expenses.length} 笔 · 合计 {formatMoney(expenses.reduce((s, t) => s + t.amount, 0))}
          </span>
        </h2>
        <div className="mt-2">
          <TxRows rows={expenses} tone="expense" />
        </div>
      </section>

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <h2 className="text-sm font-semibold text-stone-800">
          收入明细
          <span className="ml-2 font-normal text-stone-500">
            {incomes.length} 笔 · 合计 {formatMoney(incomes.reduce((s, t) => s + t.amount, 0))}
          </span>
        </h2>
        <div className="mt-2">
          <TxRows rows={incomes} tone="income" />
        </div>
      </section>
    </div>
  );
}
