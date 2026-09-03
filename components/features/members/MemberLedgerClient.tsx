"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import {
  deleteTransaction,
  fetchAllMemberTransactions,
  fetchMemberTransactionsPage,
} from "@/app/actions/ledger";
import { formatMoney } from "@/lib/ledger/format";
import type { MemberRow, TransactionRow } from "@/lib/ledger/types";
import { BackLink } from "@/components/common/BackLink";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { EditTransactionModal } from "@/components/features/record/EditTransactionModal";
import { SwipeTransactionRow } from "@/components/features/record/SwipeTransactionRow";

const PAGE_SIZE = 10;

type TypeFilter = "all" | "income" | "expense";

function matchesQuery(t: TransactionRow, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  if (t.category.toLowerCase().includes(lower)) return true;
  if (t.note?.toLowerCase().includes(lower)) return true;
  const amountStr = String(t.amount);
  if (amountStr.includes(lower)) return true;
  return false;
}

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
  // ── paginated list state ──
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

  // ── search state ──
  const [searchOpen, setSearchOpen] = useState(false);
  const [allItems, setAllItems] = useState<TransactionRow[] | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const hasActiveFilter =
    query !== "" ||
    typeFilter !== "all" ||
    categoryFilter !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  // fetch all items when search panel first opens
  useEffect(() => {
    if (!searchOpen || allItems !== null) return;
    void (async () => {
      setLoadingAll(true);
      try {
        const rows = await fetchAllMemberTransactions(memberId);
        setAllItems(rows);
      } catch (e) {
        console.error("fetchAll failed", e);
      } finally {
        setLoadingAll(false);
      }
    })();
  }, [searchOpen, allItems, memberId]);

  // derived categories from allItems for the selector
  const categories = useMemo(() => {
    const src = allItems ?? items;
    return Array.from(new Set(src.map((t) => t.category))).sort();
  }, [allItems, items]);

  // filtered results when in search mode
  const filteredItems = useMemo(() => {
    if (!searchOpen || !allItems) return null;
    return allItems.filter((t) => {
      if (!matchesQuery(t, query)) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (new Date(t.occurred_at) < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(t.occurred_at) > to) return false;
      }
      return true;
    });
  }, [searchOpen, allItems, query, typeFilter, categoryFilter, dateFrom, dateTo]);

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
        // also refresh allItems if loaded
        setAllItems(null);
      } catch (e) {
        console.error("refresh failed", e);
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
      } catch (e) {
        console.error("loadMore failed", e);
      } finally {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    })();
  }, [memberId, hasMore, pending]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || searchOpen) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root: null, rootMargin: "100px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadMore, searchOpen]);

  const displayItems = searchOpen && filteredItems ? filteredItems : items;
  const isSearchMode = searchOpen && filteredItems !== null;

  return (
    <div className="space-y-5">
      <header>
        <BackLink href="/members">成员</BackLink>
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
        {/* card header */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-stone-800">全部账单</h2>
            {!searchOpen && (
              <p className="mt-0.5 text-[10px] text-stone-400">
                向左滑动单条可编辑、删除；向下滑动到底自动加载更多
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(pending || loadingMore || loadingAll) && (
              <span className="shrink-0 text-xs text-stone-400">加载中…</span>
            )}
            <button
              onClick={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) {
                  setQuery("");
                  setTypeFilter("all");
                  setCategoryFilter("");
                  setDateFrom("");
                  setDateTo("");
                }
              }}
              className={`shrink-0 rounded-xl p-2 ring-1 transition ${
                searchOpen
                  ? "bg-orange-50 text-orange-600 ring-orange-200"
                  : "text-stone-400 ring-stone-200/80 hover:bg-orange-50 hover:text-orange-600 hover:ring-orange-200"
              }`}
              aria-label={searchOpen ? "关闭搜索" : "搜索账单"}
            >
              {searchOpen ? (
                <X className="size-[18px]" strokeWidth={1.75} aria-hidden />
              ) : (
                <Search className="size-[18px]" strokeWidth={1.75} aria-hidden />
              )}
            </button>
          </div>
        </div>

        {/* search / filter panel */}
        {searchOpen && (
          <div className="mt-3 space-y-2.5 border-b border-stone-100 pb-3">
            {/* text search */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-stone-400"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="text"
                placeholder="搜索分类、备注、金额…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-8 pr-3 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* type filter */}
            <div className="flex gap-1.5">
              {(["all", "income", "expense"] as TypeFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    typeFilter === t
                      ? t === "income"
                        ? "bg-emerald-100 text-emerald-800"
                        : t === "expense"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-orange-100 text-orange-800"
                      : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                  }`}
                >
                  {t === "all" ? "全部" : t === "income" ? "收入" : "支出"}
                </button>
              ))}
            </div>

            {/* category + date row */}
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="按分类筛选"
                className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">全部分类</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* date range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
              />
              <span className="shrink-0 text-xs text-stone-400">至</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {hasActiveFilter && (
              <button
                onClick={() => {
                  setQuery("");
                  setTypeFilter("all");
                  setCategoryFilter("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-xs text-orange-500 hover:underline"
              >
                清除全部筛选
              </button>
            )}

            {isSearchMode && (
              <p className="text-[10px] text-stone-400">
                共 {filteredItems.length} 条结果
              </p>
            )}
          </div>
        )}

        {/* transaction list */}
        <ul className="mt-2 divide-y divide-stone-100">
          {displayItems.length === 0 && (
            <li className="py-8 text-center text-sm text-stone-500">
              {loadingAll ? "加载中…" : "暂无记录"}
            </li>
          )}
          {displayItems.map((t, i) => {
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

        {/* infinite scroll sentinel (only in non-search mode) */}
        {!searchOpen && hasMore && (
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
