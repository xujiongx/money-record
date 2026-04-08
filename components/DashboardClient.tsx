"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { motion } from "framer-motion";
import { fetchTransactions, deleteTransaction } from "@/app/actions/ledger";
import { summarizeLedger, memberStats } from "@/lib/aggregates";
import { formatMoney } from "@/lib/format";
import type { MemberRow, TransactionRow } from "@/lib/types";
import { MemberAvatar } from "@/components/MemberAvatar";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { SwipeTransactionRow } from "@/components/SwipeTransactionRow";

export function DashboardClient({
  householdCode,
  initialMembers,
  initialTransactions,
}: {
  householdCode: string;
  initialMembers: MemberRow[];
  initialTransactions: TransactionRow[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  /** 最近账单：左滑展开时仅一条保持打开 */
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null);
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
        <p className="mt-1 font-mono text-xs text-white/80">
          家庭编码 {householdCode}
        </p>
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
              <MemberAvatar name={member.name} avatarUrl={member.avatar_url} size="lg" />
              <p className="mt-2 font-medium text-stone-800">{member.name}</p>
              <p className="text-xs text-stone-500">{count} 笔记账</p>
              <p className="mt-1 text-[11px] text-emerald-600">+{formatMoney(inc)}</p>
              <p className="text-[11px] text-rose-600">-{formatMoney(exp)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-stone-800">最近账单</h2>
            <p className="mt-0.5 text-[10px] text-stone-400">向左滑动单条可编辑、删除</p>
          </div>
          {pending && (
            <span className="shrink-0 text-xs text-stone-400">处理中…</span>
          )}
        </div>
        <ul className="mt-2 divide-y divide-stone-100">
          {recent.length === 0 && (
            <li className="py-8 text-center text-sm text-stone-500">暂无记录，去记一笔吧</li>
          )}
          {recent.map((t, i) => {
            const isIn = t.type === "income";
            return (
              <motion.li
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.015, duration: 0.15 }}
                className="py-0 first:pt-0"
              >
                <SwipeTransactionRow
                  rowId={t.id}
                  openSwipeId={swipeOpenId}
                  setOpenSwipeId={setSwipeOpenId}
                  onEdit={() => setEditing(t)}
                  onDelete={() => {
                    if (!confirm("确定删除这条记录？")) return;
                    if (!confirm("删除后无法恢复，请再次确认。")) return;
                    startTransition(async () => {
                      await deleteTransaction(t.id);
                      refresh();
                    });
                  }}
                >
                  <div className="flex cursor-grab gap-3 py-2.5 pl-1 pr-2 active:cursor-grabbing">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            isIn
                              ? "shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800"
                              : "shrink-0 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800"
                          }
                        >
                          {isIn ? "收入" : "支出"}
                        </span>
                        <span className="truncate text-sm font-semibold text-stone-800">
                          {t.category}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[11px] leading-snug text-stone-500">
                        {t.members?.name ?? "成员"} ·{" "}
                        {format(new Date(t.occurred_at), "M月d日 HH:mm", {
                          locale: zhCN,
                        })}
                        {t.note ? ` · ${t.note}` : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 self-start pt-0.5 text-right text-sm font-bold tabular-nums tracking-tight ${
                        isIn ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isIn ? "+" : "-"}
                      {formatMoney(t.amount)}
                    </span>
                  </div>
                </SwipeTransactionRow>
              </motion.li>
            );
          })}
        </ul>
      </section>

      {editing && (
        <EditTransactionModal
          key={editing.id}
          transaction={editing}
          members={initialMembers}
          onClose={() => {
            setEditing(null);
            setSwipeOpenId(null);
          }}
          onSaved={refresh}
        />
      )}
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

