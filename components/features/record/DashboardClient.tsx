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
import Link from "next/link";
import { resolveSelfMemberId } from "@/lib/ledger/preferences";
import {
  filterTransactionsInRange,
  getStatsDateRange,
} from "@/lib/ledger/stats-period";
import type { LedgerCategoryRow } from "@/lib/ledger/categories";
import type { MemberRow, TransactionRow } from "@/lib/ledger/types";
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import {
  MascotEmpty,
  MascotIllustration,
} from "@/components/common/MascotIllustration";
import { BudgetProgressCard } from "@/components/features/budget/BudgetProgressCard";
import { EditTransactionModal } from "@/components/features/record/EditTransactionModal";
import { SwipeTransactionRow } from "@/components/features/record/SwipeTransactionRow";
import { computeBudgetProgress } from "@/lib/budget/progress";

/** 相对上月一句；大数字已展示金额，这里不再重复「本月已花 ¥」 */
function monthCompareLine(thisExpense: number, lastExpense: number): string {
  if (thisExpense <= 0) return "本月暂无支出";
  if (lastExpense <= 0) return "尚无上月对照";
  const diffPct = ((thisExpense - lastExpense) / lastExpense) * 100;
  const abs = Math.round(Math.abs(diffPct));
  if (abs < 1) return "与上月差不多";
  if (diffPct > 0) return `比上月多 ${abs}%`;
  return `比上月少 ${abs}%`;
}

export function DashboardClient({
  initialMembers,
  initialTransactions,
  categories,
  monthBudgetAmount = null,
}: {
  initialMembers: MemberRow[];
  initialTransactions: TransactionRow[];
  categories: LedgerCategoryRow[];
  /** 本月全家总预算；null 表示未设置 */
  monthBudgetAmount?: number | null;
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
    const ids = initialMembers.map((m) => m.id);
    setSelfMemberId(resolveSelfMemberId(ids));
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

    return {
      thisSum,
      todaySum,
      todayCount: todayTx.length,
      compareLine: monthCompareLine(thisSum.expense, lastSum.expense),
      paceLine: `已过 ${day}/${daysInMonth} 天，日均 ${formatMoney(thisSum.expense / Math.max(day, 1))}`,
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
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3 px-0.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex -space-x-2.5">
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
            <h1 className="page-title text-[1.65rem] leading-tight">
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
          className="pressable inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-paper text-ink ring-1 ring-[var(--line)] hover:bg-accent-soft disabled:opacity-55"
        >
          <RefreshCw
            className={`size-4 ${syncing ? "animate-spin" : ""}`}
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </header>

      {/*
        本月总览：插画走文档流（先占位再 -mb 踩进卡片），
        不用 absolute/translate，避免各机型挡标题深浅不一。
      */}
      <div className="-mt-5">
        <div className="relative z-10 flex justify-end pr-0.5">
          <MascotIllustration
            name="homeKpi"
            size="perch"
            className="-mb-10 drop-shadow-sm"
            alt=""
          />
        </div>
        <section className="paper-panel relative z-0 space-y-5 px-5 py-5">
          <div className="max-w-[calc(100%-6.5rem)]">
            <p className="text-xs font-semibold text-[color:var(--muted)]">
              本月已花
            </p>
            <p className="kpi-number mt-2.5 text-[2.75rem] text-expense">
              {formatMoney(insights.thisSum.expense)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <p className="text-[11px] text-[color:var(--muted)]">收入</p>
              <p className="mt-1 text-[0.95rem] font-bold tabular-nums text-income">
                {formatMoney(insights.thisSum.income)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[color:var(--muted)]">结余</p>
              <p
                className={`mt-1 text-[0.95rem] font-bold tabular-nums ${
                  insights.thisSum.balance >= 0 ? "text-accent" : "text-expense"
                }`}
              >
                {formatMoney(insights.thisSum.balance)}
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-ink/65">
            {insights.compareLine}
            <span className="text-ink/25">，</span>
            {insights.paceLine}
          </p>

          <BudgetProgressCard
            progress={
              monthBudgetAmount != null && monthBudgetAmount > 0
                ? computeBudgetProgress(
                    insights.thisSum.expense,
                    monthBudgetAmount,
                  )
                : null
            }
          showSetupLink={monthBudgetAmount == null}
          embedded
          showPaceInsight
        />
        </section>
      </div>

      <section className="paper-panel px-4 py-3.5">
        <p className="text-[11px] font-bold text-[color:var(--muted)]">
          今日小结
        </p>
        {insights.todayCount === 0 ? (
          <p className="mt-1 text-sm text-ink/70">今天还没记账，去记一笔吧</p>
        ) : (
          <p className="mt-1 text-sm text-ink">
            <span className="font-extrabold">{insights.todayCount}</span> 笔，花了{" "}
            <span className="font-extrabold tabular-nums text-expense">
              {formatMoney(insights.todaySum.expense)}
            </span>
            {insights.todaySum.income > 0 ? (
              <>
                ，收入{" "}
                <span className="font-extrabold tabular-nums text-income">
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
                      <span className="text-[color:var(--muted)]"> </span>
                      {t.category}
                    </p>
                    <p className="mt-0.5 text-xs text-[color:var(--muted)]">
                      {format(new Date(t.occurred_at), "M月d日 HH:mm", {
                        locale: zhCN,
                      })}
                      {t.note ? `，${t.note}` : ""}
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
      ) : !selfMemberId ? (
        <section className="paper-panel px-4 py-3">
          <p className="text-xs leading-relaxed text-[color:var(--muted)]">
            在设置里选一下「我是谁」，这里就能看到对方刚记的账。{" "}
            <Link
              href="/members/settings"
              className="font-bold text-accent underline-offset-2 hover:underline"
            >
              去设置
            </Link>
          </p>
        </section>
      ) : null}

      <section className="paper-panel p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-ink">最近账单</h2>
            <p className="mt-0.5 text-xs text-[color:var(--muted)]">
              向左滑动可编辑、删除
            </p>
          </div>
          {pending ? (
            <span className="shrink-0 text-xs text-[color:var(--muted)]">
              处理中…
            </span>
          ) : null}
        </div>
        <ul className="mt-2 divide-y divide-[var(--line)]">
          {recent.length === 0 ? (
            <li>
              <MascotEmpty
                name="emptyNoRecords"
                title="暂无记录"
                description="去记一笔吧，布布和一二等着你"
              />
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
                  <div className="flex cursor-grab items-center gap-3 py-2.5 pl-1 pr-2 active:cursor-grabbing">
                    <CategoryIcon name={t.category} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-ink">
                          {t.category}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                            isIn ? "badge-income" : "badge-expense"
                          }`}
                        >
                          {isIn ? "收入" : "支出"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs leading-snug text-[color:var(--muted)]">
                        {t.members?.name ?? "成员"}{" "}
                        {format(new Date(t.occurred_at), "M月d日 HH:mm", {
                          locale: zhCN,
                        })}
                        {t.note ? `，${t.note}` : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 self-center text-right text-base font-extrabold tabular-nums tracking-tight ${
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
