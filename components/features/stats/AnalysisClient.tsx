"use client";

import { useState, useMemo, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subYears,
  addMonths,
  addYears,
  format,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { filterTransactionsInRange } from "@/lib/ledger/stats-period";
import { categoryBreakdown, summarizeLedger } from "@/lib/ledger/aggregates";
import { formatMoney } from "@/lib/ledger/format";
import type { TransactionRow } from "@/lib/ledger/types";

type Mode = "month" | "year";
type Tab = "income" | "expense";

const COLORS = [
  "#fb923c",
  "#f472b6",
  "#fbbf24",
  "#a78bfa",
  "#34d399",
  "#60a5fa",
  "#f87171",
];

function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 10000) {
    return `${(n / 10000).toFixed(2)}万`;
  }
  return n.toFixed(2);
}

export function AnalysisClient({
  transactions,
}: {
  transactions: TransactionRow[];
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();

  const [mode, setMode] = useState<Mode>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [tab, setTab] = useState<Tab>("expense");
  const [compare, setCompare] = useState(false);

  const { start, end } = useMemo(
    () =>
      mode === "month"
        ? { start: startOfMonth(anchor), end: endOfMonth(anchor) }
        : { start: startOfYear(anchor), end: endOfYear(anchor) },
    [mode, anchor],
  );

  const { start: prevStart, end: prevEnd } = useMemo(() => {
    const prevAnchor =
      mode === "month" ? subMonths(anchor, 1) : subYears(anchor, 1);
    return mode === "month"
      ? { start: startOfMonth(prevAnchor), end: endOfMonth(prevAnchor) }
      : { start: startOfYear(prevAnchor), end: endOfYear(prevAnchor) };
  }, [mode, anchor]);

  const currentTxs = useMemo(
    () => filterTransactionsInRange(transactions, start, end),
    [transactions, start, end],
  );
  const prevTxs = useMemo(
    () => filterTransactionsInRange(transactions, prevStart, prevEnd),
    [transactions, prevStart, prevEnd],
  );

  const summary = useMemo(() => summarizeLedger(currentTxs), [currentTxs]);

  // 基于实际流水范围生成全量周期（月度/年度）
  const allBarData = useMemo(() => {
    const now = new Date();
    let earliest = now;
    for (const t of transactions) {
      const d = new Date(t.occurred_at);
      if (d < earliest) earliest = d;
    }

    if (mode === "month") {
      const result = [];
      let cur = startOfMonth(earliest);
      const last = startOfMonth(now);
      // 最少显示 6 个月
      if (cur > subMonths(last, 5)) cur = subMonths(last, 5);
      while (cur <= last) {
        const s = startOfMonth(cur);
        const e = endOfMonth(cur);
        const { income, expense } = summarizeLedger(
          filterTransactionsInRange(transactions, s, e),
        );
        const isCurrent =
          cur.getFullYear() === anchor.getFullYear() &&
          cur.getMonth() === anchor.getMonth();
        result.push({
          label: format(cur, "M月", { locale: zhCN }),
          sublabel: format(cur, "yyyy", { locale: zhCN }),
          income,
          expense,
          isCurrent,
          anchorDate: new Date(cur),
        });
        cur = addMonths(cur, 1);
      }
      return result;
    } else {
      const result = [];
      let curYear = earliest.getFullYear();
      const nowYear = now.getFullYear();
      // 最少显示 3 年
      if (curYear > nowYear - 2) curYear = nowYear - 2;
      while (curYear <= nowYear) {
        const a = new Date(curYear, 0, 1);
        const { income, expense } = summarizeLedger(
          filterTransactionsInRange(transactions, startOfYear(a), endOfYear(a)),
        );
        result.push({
          label: `${curYear}`,
          sublabel: "",
          income,
          expense,
          isCurrent: curYear === anchor.getFullYear(),
          anchorDate: a,
        });
        curYear++;
      }
      return result;
    }
  }, [transactions, mode, anchor]);

  const maxBarValue = useMemo(
    () => Math.max(...allBarData.flatMap((p) => [p.income, p.expense]), 1),
    [allBarData],
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentBarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const btn = currentBarRef.current;
    const container = scrollContainerRef.current;
    if (!btn || !container) return;
    const btnLeft = btn.offsetLeft;
    const btnWidth = btn.offsetWidth;
    const containerWidth = container.clientWidth;
    container.scrollTo({
      left: btnLeft - containerWidth / 2 + btnWidth / 2,
      behavior: "smooth",
    });
  }, [anchor, mode]);

  const currentBreakdown = useMemo(() => {
    const rows = categoryBreakdown(currentTxs, tab);
    rows.sort((a, b) => b.value - a.value);
    return rows;
  }, [currentTxs, tab]);

  const prevBreakdownMap = useMemo(
    () => new Map(categoryBreakdown(prevTxs, tab).map((r) => [r.name, r.value])),
    [prevTxs, tab],
  );

  const totalForTab = tab === "income" ? summary.income : summary.expense;

  // 交易排行：按当前收入/支出 tab 过滤，按金额降序，最多 20 条
  const transactionRanking = useMemo(
    () =>
      currentTxs
        .filter((t) => t.type === tab)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 20),
    [currentTxs, tab],
  );

  const monthlyBalances = useMemo(() => {
    if (mode !== "year") return [];
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const isFuture =
        anchor.getFullYear() === now.getFullYear() && i > now.getMonth();
      if (isFuture) return { month: i + 1, balance: null };
      const d = new Date(anchor.getFullYear(), i, 1);
      return {
        month: i + 1,
        balance: summarizeLedger(
          filterTransactionsInRange(transactions, startOfMonth(d), endOfMonth(d)),
        ).balance,
      };
    });
  }, [transactions, mode, anchor]);

  const anchorLabel =
    mode === "month"
      ? format(anchor, "yyyy年M月", { locale: zhCN })
      : format(anchor, "yyyy年", { locale: zhCN });

  const switchMode = (m: Mode) => {
    setMode(m);
    setAnchor(new Date());
    setCompare(false);
  };
  const goPrev = () =>
    setAnchor((a) => (mode === "month" ? subMonths(a, 1) : subYears(a, 1)));
  const goNext = () =>
    setAnchor((a) => (mode === "month" ? addMonths(a, 1) : addYears(a, 1)));

  return (
    <div className="space-y-4">
      {/* 顶部导航：返回 | 月度/年度 | 重置 */}
      <div className="flex items-center gap-2">
        <Link
          href="/stats"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-2xl text-white/90 transition hover:bg-white/20"
          aria-label="返回统计"
        >
          ‹
        </Link>
        <div className="flex flex-1 rounded-xl bg-white/20 p-0.5 ring-1 ring-white/30">
          {(["month", "year"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                mode === m
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-white/90"
              }`}
            >
              {m === "month" ? "月度" : "年度"}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={refreshing}
          onClick={() => {
            setAnchor(new Date());
            setCompare(false);
            startRefresh(() => {
              router.refresh();
            });
          }}
          aria-label="刷新数据"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl text-white/90 transition hover:bg-white/20 disabled:opacity-50"
        >
          <span className={refreshing ? "animate-spin" : ""}>↺</span>
        </button>
      </div>

      {/* 汇总卡片 */}
      <div className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        {/* 期间导航 */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-lg text-stone-500 transition hover:bg-stone-100"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-stone-700">
            {anchorLabel}
          </span>
          <button
            type="button"
            onClick={goNext}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-lg text-stone-500 transition hover:bg-stone-100"
          >
            ›
          </button>
        </div>

        {/* 结余金额 */}
        <p className="text-3xl font-bold tabular-nums text-stone-900">
          {formatMoney(summary.balance)}
        </p>
        <p className="mt-0.5 text-xs text-stone-500">结余</p>

        {/* 收入/支出行 */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-stone-500">
              收入{" "}
              <span className="font-semibold tabular-nums text-stone-800">
                {summary.income.toFixed(2)}
              </span>
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            <span className="text-stone-500">
              支出{" "}
              <span className="font-semibold tabular-nums text-stone-800">
                {summary.expense.toFixed(2)}
              </span>
            </span>
          </span>
        </div>

        {/* 柱状图横向滚动，每次可见 5 个，左右滑查看更多 */}
        <div
          ref={scrollContainerRef}
          className="mt-4 -mx-4 flex items-end overflow-x-auto px-4 pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {allBarData.map((p, i) => (
            <button
              key={i}
              ref={p.isCurrent ? currentBarRef : null}
              type="button"
              onClick={() => setAnchor(p.anchorDate)}
              className={`flex min-w-[20%] shrink-0 flex-col items-center gap-1 rounded-xl py-1.5 transition active:scale-[0.96] ${
                p.isCurrent ? "bg-orange-50" : "hover:bg-stone-50"
              }`}
            >
              <div className="flex h-14 items-end gap-0.5">
                <div
                  className="w-2 rounded-sm bg-blue-300"
                  style={{
                    height: `${Math.max(4, (p.income / maxBarValue) * 56)}px`,
                  }}
                />
                <div
                  className="w-2 rounded-sm bg-orange-400"
                  style={{
                    height: `${Math.max(4, (p.expense / maxBarValue) * 56)}px`,
                  }}
                />
              </div>
              <p
                className={`text-[10px] ${
                  p.isCurrent
                    ? "font-semibold text-orange-600"
                    : "text-stone-400"
                }`}
              >
                {p.label}
              </p>
              {p.sublabel && (
                <p className="text-[9px] text-stone-300">{p.sublabel}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 年度：结余月历 */}
      {mode === "year" && (
        <div className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
          <h2 className="text-sm font-semibold text-stone-800">结余月历</h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {monthlyBalances.map(({ month, balance }) => (
              <div
                key={month}
                className="rounded-xl bg-stone-50 px-2 py-2.5 text-center"
              >
                <p className="text-[11px] text-stone-500">{month}月</p>
                {balance !== null ? (
                  <p
                    className={`mt-0.5 text-xs font-semibold tabular-nums ${
                      balance >= 0 ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    {formatCompact(balance)}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-stone-300">—</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分类汇总 */}
      <div className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        {/* 收入/支出 Tab */}
        <div className="flex gap-1 rounded-xl bg-stone-100 p-0.5">
          {(["income", "expense"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                tab === t
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500"
              }`}
            >
              {t === "income" ? "收入" : "支出"}
            </button>
          ))}
        </div>

        {/* 对比上期开关 */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-stone-700">分类汇总</p>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-stone-500">
            {mode === "month" ? "对比上月" : "对比上年"}
            <div
              role="switch"
              aria-checked={compare}
              aria-label={mode === "month" ? "对比上月" : "对比上年"}
              onClick={() => setCompare((c) => !c)}
              className={`relative h-5 w-9 rounded-full transition ${
                compare ? "bg-orange-400" : "bg-stone-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  compare ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
          </label>
        </div>

        {/* 分类列表 */}
        {currentBreakdown.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            本期暂无{tab === "income" ? "收入" : "支出"}数据
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {currentBreakdown.map((row, i) => {
              const pct = totalForTab > 0 ? (row.value / totalForTab) * 100 : 0;
              const prevVal = prevBreakdownMap.get(row.name) ?? 0;
              const diff =
                compare && prevVal > 0
                  ? ((row.value - prevVal) / prevVal) * 100
                  : null;
              const isExpense = tab === "expense";
              return (
                <li key={row.name}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        aria-hidden
                      />
                      <span className="truncate text-sm text-stone-700">
                        {row.name}
                      </span>
                      <span className="shrink-0 text-xs text-stone-400">
                        {pct.toFixed(0)}%，{row.count}笔
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {diff !== null && (
                        <span
                          className={`text-[10px] font-medium ${
                            isExpense
                              ? diff > 0
                                ? "text-rose-500"
                                : "text-emerald-600"
                              : diff > 0
                                ? "text-emerald-600"
                                : "text-rose-500"
                          }`}
                        >
                          {diff > 0 ? "+" : ""}
                          {diff.toFixed(0)}%
                        </span>
                      )}
                      <span className="text-sm font-semibold tabular-nums text-stone-900">
                        {formatMoney(row.value)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 交易排行 */}
      <div className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <h2 className="text-sm font-semibold text-stone-800">
          {tab === "income" ? "收入" : "支出"}排行
        </h2>
        {transactionRanking.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            本期暂无{tab === "income" ? "收入" : "支出"}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {transactionRanking.map((t, i) => {
              const rank = i + 1;
              const isIncome = t.type === "income";
              const date = new Date(t.occurred_at);
              const dateLabel = format(date, "MM-dd HH:mm");
              return (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  {/* 排名徽章 */}
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      rank === 1
                        ? "bg-amber-400 text-white"
                        : rank === 2
                          ? "bg-stone-300 text-white"
                          : rank === 3
                            ? "bg-orange-300 text-white"
                            : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {rank}
                  </span>

                  {/* 描述 */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-800">
                      {t.category}
                      {t.note ? (
                        <span className="ml-1 font-normal text-stone-500">
                          · {t.note}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-400">
                      {t.members?.name ?? "—"}
                      <span className="mx-1 text-stone-200">·</span>
                      {dateLabel}
                    </p>
                  </div>

                  {/* 金额 */}
                  <span
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      isIncome ? "text-emerald-700" : "text-stone-800"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatMoney(t.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
