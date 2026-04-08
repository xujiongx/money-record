"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  deleteTransaction,
  fetchMemberTransactionsPage,
} from "@/app/actions/ledger";
import { formatMoney } from "@/lib/format";
import type { MemberRow, TransactionRow } from "@/lib/types";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { EditTransactionModal } from "@/components/features/record/EditTransactionModal";
import { SwipeTransactionRow } from "@/components/features/record/SwipeTransactionRow";

const PAGE_SIZE = 10;

export function MemberLedgerClient({
  householdCode,
  memberId,
  member,
  initialMembers,
  initialItems,
  initialHasMore,
}: {
  householdCode: string;
  memberId: string;
  member: MemberRow;
  initialMembers: MemberRow[];
  initialItems: TransactionRow[];
  initialHasMore: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const itemsLenRef = useRef(items.length);
  useEffect(() => {
    itemsLenRef.current = items.length;
  }, [items.length]);

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        const take = Math.max(itemsLenRef.current, PAGE_SIZE);
        const { items: next, hasMore: hm } = await fetchMemberTransactionsPage(
          memberId,
          0,
          take,
        );
        setItems(next);
        setHasMore(hm);
      } catch {
        /* ignore */
      }
    });
  }, [memberId]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMoreRef.current || pending) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    void (async () => {
      try {
        const offset = itemsLenRef.current;
        const { items: next, hasMore: hm } = await fetchMemberTransactionsPage(
          memberId,
          offset,
          PAGE_SIZE,
        );
        setItems((prev) => [...prev, ...next]);
        setHasMore(hm);
      } catch {
        /* ignore */
      } finally {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    })();
  }, [memberId, hasMore, pending]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { root: null, rootMargin: "100px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div className="space-y-5">
      <header>
        <Link
          href="/members"
          className="inline-flex items-center gap-1 text-sm font-medium text-white/90 transition hover:text-white"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0"
            aria-hidden
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          成员
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <MemberAvatar name={member.name} avatarUrl={member.avatar_url} size="lg" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
              {member.name}的账单
            </h1>
            <p className="mt-0.5 font-mono text-xs text-white/80">
              家庭编码 {householdCode}
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-stone-800">全部账单</h2>
            <p className="mt-0.5 text-[10px] text-stone-400">
              向左滑动单条可编辑、删除；向下滑动到底自动加载更多
            </p>
          </div>
          {(pending || loadingMore) && (
            <span className="shrink-0 text-xs text-stone-400">加载中…</span>
          )}
        </div>
        <ul className="mt-2 divide-y divide-stone-100">
          {items.length === 0 && (
            <li className="py-8 text-center text-sm text-stone-500">
              暂无记录
            </li>
          )}
          {items.map((t, i) => {
            const isIn = t.type === "income";
            return (
              <motion.li
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.015, 0.2), duration: 0.15 }}
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
        {hasMore && (
          <div
            ref={sentinelRef}
            className="flex min-h-10 items-center justify-center py-3 text-xs text-stone-400"
            aria-hidden
          >
            {loadingMore ? "加载更多…" : "继续下滑加载更多"}
          </div>
        )}
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
