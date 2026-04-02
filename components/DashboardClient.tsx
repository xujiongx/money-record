"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { motion } from "framer-motion";
import { fetchTransactions, deleteTransaction } from "@/app/actions/ledger";
import { HOUSEHOLD_ID } from "@/lib/constants";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { summarizeLedger, memberStats } from "@/lib/aggregates";
import { formatMoney } from "@/lib/format";
import type { MemberRow, TransactionRow } from "@/lib/types";
import { MemberAvatar } from "@/components/MemberAvatar";

export function DashboardClient({
  initialMembers,
  initialTransactions,
}: {
  initialMembers: MemberRow[];
  initialTransactions: TransactionRow[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        const next = await fetchTransactions();
        setTransactions(next);
      } catch {
        /* ignore */
      }
    });
  }, []);

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  useEffect(() => {
    let supabase;
    try {
      supabase = createBrowserSupabase();
    } catch {
      return;
    }
    const channel = supabase
      .channel("ledger-tx")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `household_id=eq.${HOUSEHOLD_ID}`,
        },
        () => refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  const { income, expense, balance } = useMemo(
    () => summarizeLedger(transactions),
    [transactions],
  );
  const stats = useMemo(
    () => memberStats(transactions, initialMembers),
    [transactions, initialMembers],
  );
  const recent = useMemo(() => transactions.slice(0, 20), [transactions]);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-medium text-white/90">家庭财务概览</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white drop-shadow-sm">
          温暖小账本
        </h1>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-2"
      >
        <SummaryCard label="总收入" value={income} tone="income" />
        <SummaryCard label="总支出" value={expense} tone="expense" />
        <SummaryCard label="结余" value={balance} tone="balance" highlight />
      </motion.section>

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-stone-800">家庭成员</h2>
        <div className="mt-3 flex justify-around gap-3">
          {stats.map(({ member, count, income: inc, expense: exp }) => (
            <div key={member.id} className="flex flex-col items-center text-center">
              <MemberAvatar name={member.name} size="lg" />
              <p className="mt-2 font-medium text-stone-800">{member.name}</p>
              <p className="text-xs text-stone-500">{count} 笔记账</p>
              <p className="mt-1 text-[11px] text-emerald-600">+{formatMoney(inc)}</p>
              <p className="text-[11px] text-rose-600">-{formatMoney(exp)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-800">最近账单</h2>
          {pending && (
            <span className="text-xs text-stone-400">同步中…</span>
          )}
        </div>
        <ul className="mt-3 space-y-2">
          {recent.length === 0 && (
            <li className="py-8 text-center text-sm text-stone-500">暂无记录，去记一笔吧</li>
          )}
          {recent.map((t, i) => (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between gap-2 rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      t.type === "income"
                        ? "rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800"
                        : "rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-800"
                    }
                  >
                    {t.type === "income" ? "收入" : "支出"}
                  </span>
                  <span className="truncate text-sm font-medium text-stone-800">
                    {t.category}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-stone-500">
                  {t.members?.name ?? "成员"} ·{" "}
                  {format(new Date(t.occurred_at), "M月d日 HH:mm", { locale: zhCN })}
                  {t.note ? ` · ${t.note}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={
                    t.type === "income"
                      ? "text-sm font-semibold text-emerald-600"
                      : "text-sm font-semibold text-rose-600"
                  }
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatMoney(t.amount)}
                </span>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label="删除本条"
                  onClick={() => {
                    if (confirm("确定删除这条记录？")) {
                      startTransition(async () => {
                        await deleteTransaction(t.id);
                        refresh();
                      });
                    }
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  highlight,
}: {
  label: string;
  value: number;
  tone: "income" | "expense" | "balance";
  highlight?: boolean;
}) {
  const color =
    tone === "income"
      ? "text-emerald-700"
      : tone === "expense"
        ? "text-rose-700"
        : value >= 0
          ? "text-orange-700"
          : "text-rose-700";

  return (
    <div
      className={`rounded-2xl px-2 py-3 text-center shadow-md ring-1 ring-white/60 ${
        highlight
          ? "bg-gradient-to-br from-white to-orange-50"
          : "bg-white/95"
      }`}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className={`mt-1 truncate text-sm font-bold ${color}`}>{formatMoney(value)}</p>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
