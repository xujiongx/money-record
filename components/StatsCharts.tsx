"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { fetchTransactions } from "@/app/actions/ledger";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { sumByCategory, memberExpenseTotals } from "@/lib/aggregates";
import {
  type StatsPeriod,
  filterTransactionsInRange,
  formatStatsPeriodLabel,
  getStatsDateRange,
  shiftStatsAnchor,
} from "@/lib/stats-period";
import { formatMoney } from "@/lib/format";
import type { MemberRow, TransactionRow } from "@/lib/types";

const COLORS = [
  "#fb923c",
  "#f472b6",
  "#fbbf24",
  "#a78bfa",
  "#34d399",
  "#60a5fa",
  "#f87171",
];

const POLL_MS = 5000;

const PERIOD_TABS: { id: StatsPeriod; label: string }[] = [
  { id: "day", label: "日" },
  { id: "week", label: "周" },
  { id: "month", label: "月" },
  { id: "year", label: "年" },
];

export function StatsCharts({
  householdCode,
  transactions: initialTransactions,
  members,
}: {
  householdCode: string;
  transactions: TransactionRow[];
  members: MemberRow[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [period, setPeriod] = useState<StatsPeriod>("month");
  /** 当前统计区间锚点（切换日/周/月/年时用「今天」重置） */
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [, startTransition] = useTransition();

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
    const id = window.setInterval(() => refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getStatsDateRange(period, anchorDate),
    [period, anchorDate],
  );

  const scopedTransactions = useMemo(
    () => filterTransactionsInRange(transactions, rangeStart, rangeEnd),
    [transactions, rangeStart, rangeEnd],
  );

  const periodLabel = useMemo(
    () => formatStatsPeriodLabel(period, anchorDate),
    [period, anchorDate],
  );

  const expenseByCat = useMemo(
    () => sumByCategory(scopedTransactions, "expense"),
    [scopedTransactions],
  );
  const incomeByCat = useMemo(
    () => sumByCategory(scopedTransactions, "income"),
    [scopedTransactions],
  );
  const memberBars = useMemo(
    () => memberExpenseTotals(scopedTransactions, members),
    [scopedTransactions, members],
  );

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-medium text-white/90">可视化分析</p>
        <h1 className="mt-1 text-2xl font-bold text-white drop-shadow-sm">
          收支统计
        </h1>
        <p className="mt-1 font-mono text-xs text-white/80">
          家庭编码 {householdCode}
        </p>
      </header>

      <div className="rounded-2xl bg-white/95 p-3 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <p className="text-center text-xs font-medium text-stone-500">
          统计维度
        </p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {PERIOD_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setPeriod(id);
                setAnchorDate(new Date());
              }}
              className={`rounded-xl py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
                period === id
                  ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-stretch gap-2">
          <button
            type="button"
            aria-label="上一时间段"
            onClick={() =>
              setAnchorDate((a) => shiftStatsAnchor(period, a, -1))
            }
            className="flex w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-lg font-medium text-stone-600 transition hover:bg-stone-50 active:scale-[0.97]"
          >
            ‹
          </button>
          <div className="min-w-0 flex-1 rounded-xl border border-stone-100 bg-stone-50/80 px-2 py-2">
            <p className="text-center text-sm font-semibold leading-snug text-stone-800">
              {periodLabel}
            </p>
          </div>
          <button
            type="button"
            aria-label="下一时间段"
            onClick={() =>
              setAnchorDate((a) => shiftStatsAnchor(period, a, 1))
            }
            className="flex w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-lg font-medium text-stone-600 transition hover:bg-stone-50 active:scale-[0.97]"
          >
            ›
          </button>
        </div>

        <button
          type="button"
          onClick={() => setAnchorDate(new Date())}
          className="mt-2 w-full rounded-lg py-2 text-xs font-medium text-orange-600 transition hover:bg-orange-50"
        >
          回到今天
        </button>

        <p className="mt-2 text-center text-[11px] text-stone-400">
          图表与下方汇总均按此时间范围筛选（以记账时间为准）
        </p>
      </div>

      {/* 不要用含时间戳的 key，否则每次切期都会卸载整块 Recharts，ResponsiveContainer 重测 DOM 很慢 */}
      <div className="space-y-5">
        <ChartCard title="支出分类">
          {expenseByCat.length === 0 ? (
            <Empty />
          ) : (
            <div className="h-56 w-full min-h-[224px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    isAnimationActive={false}
                    data={expenseByCat}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {expenseByCat.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) =>
                      formatMoney(typeof v === "number" ? v : Number(v) || 0)
                    }
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="收入来源占比">
          {incomeByCat.length === 0 ? (
            <Empty />
          ) : (
            <div className="h-56 w-full min-h-[224px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    isAnimationActive={false}
                    data={incomeByCat}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {incomeByCat.map((_, i) => (
                      <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) =>
                      formatMoney(typeof v === "number" ? v : Number(v) || 0)
                    }
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="成员支出对比">
          {memberBars.every((b) => b.total === 0) ? (
            <Empty />
          ) : (
            <div className="h-56 w-full min-h-[224px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberBars} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#78716c" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} tickFormatter={(v) => `¥${v}`} />
                  <Tooltip
                    formatter={(v) =>
                      formatMoney(typeof v === "number" ? v : Number(v) || 0)
                    }
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                  />
                  <Bar isAnimationActive={false} dataKey="total" radius={[8, 8, 0, 0]}>
                    {memberBars.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
      <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Empty() {
  return (
    <p className="py-10 text-center text-sm text-stone-500">该维度下暂无数据</p>
  );
}
