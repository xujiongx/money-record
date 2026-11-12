"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { RefreshCw } from "lucide-react";
import {
  fetchTransactions,
  deleteTransaction,
  refreshLedgerReadCache,
} from "@/app/actions/ledger";
import { summarizeLedger } from "@/lib/ledger/aggregates";
import { formatMoney } from "@/lib/ledger/format";
import type { LedgerCategoryRow } from "@/lib/ledger/categories";
import type { MemberRow, TransactionRow } from "@/lib/ledger/types";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { EditTransactionModal } from "@/components/features/record/EditTransactionModal";
import { SwipeTransactionRow } from "@/components/features/record/SwipeTransactionRow";

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

  const { income, expense, balance } = useMemo(
    () => summarizeLedger(transactions),
    [transactions],
  );
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
        <p className="text-[11px] font-medium text-stone-500">结余</p>
        <p
          className={`page-title mt-1 text-3xl tabular-nums tracking-tight ${
            balance >= 0 ? "text-accent" : "text-expense"
          }`}
        >
          {formatMoney(balance)}
        </p>
        <div className="mt-3 flex gap-4 text-sm">
          <p className="text-income">
            <span className="text-[11px] text-stone-500">收入 </span>
            <span className="font-semibold tabular-nums">
              {formatMoney(income)}
            </span>
          </p>
          <p className="text-expense">
            <span className="text-[11px] text-stone-500">支出 </span>
            <span className="font-semibold tabular-nums">
              {formatMoney(expense)}
            </span>
          </p>
        </div>
      </section>

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
