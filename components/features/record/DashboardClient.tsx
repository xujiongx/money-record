"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, getDate, getDaysInMonth, subMonths } from "date-fns";
import { zhCN } from "date-fns/locale";
import { RefreshCw } from "lucide-react";
import {
  fetchTransactions,
  deleteTransaction,
  refreshLedgerReadCache,
} from "@/app/actions/ledger";
import { summarizeLedger } from "@/lib/ledger/aggregates";
import { formatMoney } from "@/lib/ledger/format";
import { LAST_RECORD_MEMBER_KEY } from "@/lib/ledger/preferences";
import {
  filterTransactionsInRange,
  getStatsDateRange,
} from "@/lib/ledger/stats-period";
import type { LedgerCategoryRow } from "@/lib/ledger/categories";
import type { MemberRow, TransactionRow } from "@/lib/ledger/types";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { EditTransactionModal } from "@/components/features/record/EditTransactionModal";
import { SwipeTransactionRow } from "@/components/features/record/SwipeTransactionRow";

function monthExpenseLine(thisExpense: number, lastExpense: number): string {
  if (thisExpense <= 0) return "本月暂无支出";
  if (lastExpense <= 0) return `本月已花 ${formatMoney(thisExpense)}`;
  const diffPct = ((thisExpense - lastExpense) / lastExpense) * 100;
  const abs = Math.round(Math.abs(diffPct));
  if (abs < 1) {
    return `本月已花 ${formatMoney(thisExpense)} · 与上月差不多`;
  }
  if (diffPct > 0) {
    return `本月已花 ${formatMoney(thisExpense)} · 比上月多 ${abs}%`;
  }
  return `本月已花 ${formatMoney(thisExpense)} · 比上月少 ${abs}%`;
}

export function DashboardClient({
  initialMembers,
  initialTransactions,
  categories,
}: {
  initialMembers: MemberRow[];
  initialTransactions: TransactionRow[];
  categories: LedgerCategoryRow[];
}) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  /** 最近账单：左滑展开时仅一条保持打开 */
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null);
  const [selfMemberId, setSelfMemberId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [syncing, startSyncTransition] = useTransition();

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
    try {
      const stored = localStorage.getItem(LAST_RECORD_MEMBER_KEY);
      if (stored && initialMembers.some((m) => m.id === stored)) {
        setSelfMemberId(stored);
      }
    } catch {
      /* private mode */
    }
  }, [initialMembers]);

  const insights = useMemo(() => {
    const now = new Date();
    const thisRange = getStatsDateRange("month", now);
    const lastRange = getStatsDateRange("month", subMonths(now, 1));
    const todayRange = getStatsDateRange("day", now);

    const thisMonthTx = filterTransactionsInRange(
      transactions,
      thisRange.start,
      thisRange.end,
    );
    const lastMonthTx = filterTransactionsInRange(
      transactions,
      lastRange.start,
      lastRange.end,
    );
    const todayTx = filterTransactionsInRange(
      transactions,
      todayRange.start,
      todayRange.end,
    );

    const thisSum = summarizeLedger(thisMonthTx);
    const lastSum = summarizeLedger(lastMonthTx);
    const todaySum = summarizeLedger(todayTx);
    const day = getDate(now);
    const daysInMonth = getDaysInMonth(now);
    const vsLastRatio =
      lastSum.expense > 0
        ? Math.min(thisSum.expense / lastSum.expense, 1.5)
        : thisSum.expense > 0
          ? 1
          : 0;

    return {
      thisSum,
      lastSum,
      todaySum,
      todayCount: todayTx.length,
      expenseLine: monthExpenseLine(thisSum.expense, lastSum.expense),
      paceLine: `已过 ${day}/${daysInMonth} 天 · 日均 ${formatMoney(thisSum.expense / Math.max(day, 1))}`,
      vsLastRatio,
    };
  }, [transactions]);

  const partnerRecent = useMemo(() => {
    if (!selfMemberId) return [] as TransactionRow[];
    return transactions
      .filter((t) => t.member_id !== selfMemberId)
      .slice(0, 2);
  }, [transactions, selfMemberId]);

  const recent = useMemo(() => transactions.slice(0, 20), [transactions]);
  const coupleNames = initialMembers
    .slice(0, 2)
    .map((m) => m.name)
    .join(" & ");

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex -space-x-2">
            {initialMembers.slice(0, 2).map((m) => (
              <MemberAvatar
                key={m.id}
                name={m.name}
                avatarUrl={m.avatar_url}
                size="md"
                className="ring-2 ring-background"
              />
            ))}
          </div>
          <div className="min-w-0">
            <h1 className="page-title text-2xl leading-tight">
              {coupleNames || "我们的账本"}
            </h1>
          </div>
        </div>
        <button
          type="button"
          disabled={syncing}
          aria-label={syncing ? "正在刷新" : "刷新数据"}
          onClick={() => {
            startSyncTransition(async () => {
              try {
                await refreshLedgerReadCache();
                router.refresh();
              } catch {
                /* 未登录等 */
              }
            });
          }}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-paper text-ink transition hover:bg-accent-soft active:scale-[0.98] disabled:opacity-55"
        >
          <RefreshCw
            className={`size-4 ${syncing ? "animate-spin" : ""}`}
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </header>

      <section className="paper-panel p-4">
        <p className="text-[11px] font-medium text-stone-500">本月已花</p>
        <p className="page-title mt-1 text-3xl tabular-nums tracking-tight text-expense">
          {formatMoney(insights.thisSum.expense)}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <p className="text-income">
            <span className="text-[11px] text-stone-500">收入 </span>
            <span className="font-semibold tabular-nums">
              {formatMoney(insights.thisSum.income)}
            </span>
          </p>
          <p>
            <span className="text-[11px] text-stone-500">结余 </span>
            <span
              className={`font-semibold tabular-nums ${
                insights.thisSum.balance >= 0 ? "text-accent" : "text-expense"
              }`}
            >
              {formatMoney(insights.thisSum.balance)}
            </span>
          </p>
        </div>

        {insights.lastSum.expense > 0 ? (
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-background"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-expense/80 transition-[width] duration-300 ease-out"
              style={{
                width: `${Math.max(4, Math.min(insights.vsLastRatio * 100, 100))}%`,
              }}
            />
          </div>
        ) : null}

        <p className="mt-2 text-xs leading-relaxed text-stone-600">
          {insights.expenseLine}
        </p>
        <p className="mt-0.5 text-[11px] text-stone-400">{insights.paceLine}</p>
      </section>

      <section className="paper-panel px-4 py-3">
        <p className="text-[11px] font-medium text-stone-500">今日小结</p>
        {insights.todayCount === 0 ? (
          <p className="mt-1 text-sm text-stone-500">今天还没记账</p>
        ) : (
          <p className="mt-1 text-sm text-ink">
            <span className="font-semibold">{insights.todayCount}</span> 笔
            <span className="text-stone-300"> · </span>
            花了{" "}
            <span className="font-semibold tabular-nums text-expense">
              {formatMoney(insights.todaySum.expense)}
            </span>
            {insights.todaySum.income > 0 ? (
              <>
                <span className="text-stone-300"> · </span>
                收入{" "}
                <span className="font-semibold tabular-nums text-income">
                  {formatMoney(insights.todaySum.income)}
                </span>
              </>
            ) : null}
          </p>
        )}
      </section>

      {partnerRecent.length > 0 ? (
        <section className="paper-panel p-4">
          <h2 className="text-sm font-semibold text-ink">对方刚记了</h2>
          <ul className="mt-2 space-y-2.5">
            {partnerRecent.map((t) => {
              const isIn = t.type === "income";
              return (
                <li key={t.id} className="flex items-center gap-3">
                  <MemberAvatar
                    name={t.members?.name ?? "成员"}
                    avatarUrl={
                      initialMembers.find((m) => m.id === t.member_id)
                        ?.avatar_url ?? null
                    }
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {t.members?.name ?? "成员"}
                      <span className="text-stone-300"> · </span>
                      {t.category}
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      {format(new Date(t.occurred_at), "M月d日 HH:mm", {
                        locale: zhCN,
                      })}
                      {t.note ? ` · ${t.note}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold tabular-nums ${
                      isIn ? "text-income" : "text-expense"
                    }`}
                  >
                    {isIn ? "+" : "-"}
                    {formatMoney(t.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="paper-panel p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-ink">最近账单</h2>
            <p className="mt-0.5 text-[10px] text-stone-400">
              向左滑动可编辑、删除
            </p>
          </div>
          {pending ? (
            <span className="shrink-0 text-xs text-stone-400">处理中…</span>
          ) : null}
        </div>
        <ul className="mt-2 divide-y divide-[var(--line)]">
          {recent.length === 0 ? (
            <li className="py-8 text-center text-sm text-stone-500">
              暂无记录，去记一笔吧
            </li>
          ) : null}
          {recent.map((t) => {
            const isIn = t.type === "income";
            return (
              <li key={t.id} className="py-0 first:pt-0">
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
                              ? "shrink-0 rounded-md bg-[#d1fae5] px-1.5 py-0.5 text-[10px] font-semibold text-income"
                              : "shrink-0 rounded-md bg-[#ffe4e6] px-1.5 py-0.5 text-[10px] font-semibold text-expense"
                          }
                        >
                          {isIn ? "收入" : "支出"}
                        </span>
                        <span className="truncate text-sm font-semibold text-ink">
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
                        isIn ? "text-income" : "text-expense"
                      }`}
                    >
                      {isIn ? "+" : "-"}
                      {formatMoney(t.amount)}
                    </span>
                  </div>
                </SwipeTransactionRow>
              </li>
            );
          })}
        </ul>
      </section>

      {editing ? (
        <EditTransactionModal
          key={editing.id}
          transaction={editing}
          members={initialMembers}
          categories={categories}
          onClose={() => {
            setEditing(null);
            setSwipeOpenId(null);
          }}
          onSaved={refresh}
        />
      ) : null}
    </div>
  );
}
