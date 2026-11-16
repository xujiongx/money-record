"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  clearHouseholdMonthBudget,
  upsertHouseholdMonthBudget,
} from "@/app/actions/budget";
import { monthPeriodKey } from "@/lib/budget/period";
import type { BudgetRow } from "@/lib/budget/types";
import { formatMoney } from "@/lib/ledger/format";
import { SubpageHeader } from "@/components/common/SubpageHeader";

export function BudgetSettingsClient({
  initialBudget,
  periodKey,
}: {
  initialBudget: BudgetRow | null;
  periodKey: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(
    initialBudget ? String(initialBudget.amount) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const label = format(new Date(`${periodKey}-01T12:00:00`), "yyyy年M月", {
    locale: zhCN,
  });

  const save = () => {
    setError(null);
    setToast(null);
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setError("请输入大于 0 的金额");
      return;
    }
    startTransition(async () => {
      try {
        await upsertHouseholdMonthBudget(n, periodKey);
        setToast("预算已保存");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存失败");
      }
    });
  };

  const clear = () => {
    setError(null);
    setToast(null);
    startTransition(async () => {
      try {
        await clearHouseholdMonthBudget(periodKey);
        setAmount("");
        setToast("已清空本月预算");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "清空失败");
      }
    });
  };

  return (
    <div className="space-y-4">
      <SubpageHeader backHref="/tools" title="预算" historyBack />

      <section className="paper-panel space-y-3 p-4">
        <p className="text-xs font-bold text-[color:var(--muted)]">
          {label} · 全家支出上限
        </p>
        <p className="text-sm leading-relaxed text-ink/70">
          只约束日常记账支出，大事记账不计入。超预算也能继续记账。
        </p>
        {initialBudget ? (
          <p className="text-sm text-ink">
            当前：
            <span className="ml-1 font-extrabold tabular-nums text-accent">
              {formatMoney(initialBudget.amount)}
            </span>
          </p>
        ) : (
          <p className="text-sm text-ink/60">本月还没设预算</p>
        )}

        <label className="block text-xs font-bold text-[color:var(--muted)]">
          金额
        </label>
        <div className="flex items-baseline gap-1 rounded-[1.25rem] border border-[var(--line)] bg-background px-4 py-3 focus-within:border-accent">
          <span className="text-xl font-extrabold text-[color:var(--muted)]">
            ¥
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="例如 3000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-2xl font-extrabold tabular-nums text-ink outline-none"
          />
        </div>

        {error ? (
          <p className="text-sm font-semibold text-expense">{error}</p>
        ) : null}
        {toast ? (
          <p className="text-sm font-semibold text-accent">{toast}</p>
        ) : null}

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="btn-primary w-full disabled:opacity-55"
          >
            {pending ? "保存中…" : "保存本月预算"}
          </button>
          {initialBudget || amount ? (
            <button
              type="button"
              disabled={pending}
              onClick={clear}
              className="pressable w-full rounded-full py-2.5 text-sm font-bold text-[color:var(--muted)] hover:bg-accent-soft/50 disabled:opacity-55"
            >
              清空本月预算
            </button>
          ) : null}
        </div>
      </section>

      <p className="px-1 text-[11px] text-[color:var(--muted)]">
        月键 {periodKey || monthPeriodKey()} · 仅当前家庭可见
      </p>
    </div>
  );
}
