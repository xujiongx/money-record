"use client";

import { useMemo, useState } from "react";
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
import {
  categoryBreakdown,
  memberPeriodBreakdown,
  summarizeLedger,
} from "@/lib/ledger/aggregates";
import {
  type StatsPeriod,
  filterTransactionsInRange,
  formatStatsPeriodLabel,
  getStatsDateRange,
  shiftStatsAnchor,
} from "@/lib/ledger/stats-period";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { formatMoney } from "@/lib/ledger/format";
import type { MemberRow, TransactionRow } from "@/lib/ledger/types";

const COLORS = [
  "#fb923c",
  "#f472b6",
  "#fbbf24",
  "#a78bfa",
  "#34d399",
  "#60a5fa",
  "#f87171",
];

function formatPercent(part: number, total: number) {
  if (total <= 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function formatStatsRangeBounds(start: Date, end: Date) {
  return `${format(start, "yyyy年M月d日", { locale: zhCN })} — ${format(end, "yyyy年M月d日", { locale: zhCN })}`;
}

const PERIOD_TABS: { id: StatsPeriod; label: string }[] = [
  { id: "day", label: "日" },
  { id: "week", label: "周" },
  { id: "month", label: "月" },
  { id: "year", label: "年" },
];

export function StatsCharts({
  householdCode,
  transactions,
  members,
}: {
  householdCode: string;
  transactions: TransactionRow[];
  members: MemberRow[];
}) {
  const [period, setPeriod] = useState<StatsPeriod>("month");
  /** 当前统计区间锚点（切换日/周/月/年时用「今天」重置） */
  const [anchorDate, setAnchorDate] = useState(() => new Date());

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

  const periodSummary = useMemo(
    () => summarizeLedger(scopedTransactions),
    [scopedTransactions],
  );
  const txCount = scopedTransactions.length;

  const expenseBreakdown = useMemo(() => {
    const rows = categoryBreakdown(scopedTransactions, "expense");
    rows.sort((a, b) => b.value - a.value);
    return rows;
  }, [scopedTransactions]);
  const incomeBreakdown = useMemo(() => {
    const rows = categoryBreakdown(scopedTransactions, "income");
    rows.sort((a, b) => b.value - a.value);
    return rows;
  }, [scopedTransactions]);

  const expenseByCat = useMemo(
    () => expenseBreakdown.map(({ name, value }) => ({ name, value })),
    [expenseBreakdown],
  );
  const incomeByCat = useMemo(
    () => incomeBreakdown.map(({ name, value }) => ({ name, value })),
    [incomeBreakdown],
  );

  const totalExpenseInScope = periodSummary.expense;
  const totalIncomeInScope = periodSummary.income;

  const memberDetail = useMemo(
    () => memberPeriodBreakdown(scopedTransactions, members),
    [scopedTransactions, members],
  );
  const memberBars = useMemo(
    () => memberDetail.map((m) => ({ name: m.name, total: m.expense })),
    [memberDetail],
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
          以下数据均按此时间范围筛选（以记账时间 occurred_at 为准）
        </p>
      </div>

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <h2 className="text-sm font-semibold text-stone-800">本区间汇总</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
          {formatStatsRangeBounds(rangeStart, rangeEnd)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <SummaryTile label="总收入" value={periodSummary.income} tone="income" />
          <SummaryTile label="总支出" value={periodSummary.expense} tone="expense" />
          <SummaryTile label="结余" value={periodSummary.balance} tone="balance" />
          <div className="rounded-xl border border-stone-100 bg-stone-50/90 px-3 py-2.5">
            <p className="text-[11px] font-medium text-stone-500">记账笔数</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-stone-800">{txCount}</p>
            <p className="mt-0.5 text-[10px] text-stone-400">收入 + 支出条数合计</p>
          </div>
        </div>
      </section>

      {/* 不要用含时间戳的 key，否则每次切期都会卸载整块 Recharts，ResponsiveContainer 重测 DOM 很慢 */}
      <div className="space-y-5">
        <ChartCard
          title="支出分类"
          subtitle={
            totalExpenseInScope > 0
              ? `支出合计 ${formatMoney(totalExpenseInScope)} · ${expenseBreakdown.reduce((s, r) => s + r.count, 0)} 笔 · ${expenseBreakdown.length} 个分类`
              : "本区间暂无支出"
          }
        >
          {expenseByCat.length === 0 ? (
            <Empty />
          ) : (
            <>
              <div className="h-56 w-full min-h-[224px] min-w-0">
                <ResponsiveContainer width="100%" height={224} minWidth={0}>
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
              <CategoryDetailList
                rows={expenseBreakdown}
                total={totalExpenseInScope}
                colorAtIndex={(i) => COLORS[i % COLORS.length]}
              />
            </>
          )}
        </ChartCard>

        <ChartCard
          title="收入来源占比"
          subtitle={
            totalIncomeInScope > 0
              ? `收入合计 ${formatMoney(totalIncomeInScope)} · ${incomeBreakdown.reduce((s, r) => s + r.count, 0)} 笔 · ${incomeBreakdown.length} 个来源`
              : "本区间暂无收入"
          }
        >
          {incomeByCat.length === 0 ? (
            <Empty />
          ) : (
            <>
              <div className="h-56 w-full min-h-[224px] min-w-0">
                <ResponsiveContainer width="100%" height={224} minWidth={0}>
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
              <CategoryDetailList
                rows={incomeBreakdown}
                total={totalIncomeInScope}
                colorAtIndex={(i) => COLORS[(i + 2) % COLORS.length]}
              />
            </>
          )}
        </ChartCard>

        <ChartCard
          title="成员支出对比"
          subtitle={
            memberBars.some((b) => b.total > 0)
              ? `支出合计 ${formatMoney(totalExpenseInScope)}（与上方汇总一致）`
              : "本区间暂无成员支出"
          }
        >
          {memberBars.every((b) => b.total === 0) ? (
            <Empty />
          ) : (
            <div className="w-full min-w-0 pt-2">
              <div className="h-56 w-full min-h-[224px] min-w-0">
                <ResponsiveContainer width="100%" height={224} minWidth={0}>
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
            </div>
          )}
          {txCount > 0 && (
            <div className="mt-3 border-t border-stone-100 pt-3">
              <p className="text-xs font-semibold text-stone-700">成员明细（本区间）</p>
              <ul className="mt-2 space-y-2">
                {memberDetail.map((m) => {
                  const net = m.income - m.expense;
                  const totalMemberTx = m.expenseCount + m.incomeCount;
                  return (
                    <li
                      key={m.memberId}
                      className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2 text-[12px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-stone-800">{m.name}</span>
                        <span
                          className={`shrink-0 font-semibold tabular-nums ${
                            net >= 0 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          净额 {formatMoney(net)}
                        </span>
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-stone-600">
                        <span>
                          支出 {formatMoney(m.expense)}
                          <span className="text-stone-400"> · {m.expenseCount} 笔</span>
                        </span>
                        <span>
                          收入 {formatMoney(m.income)}
                          <span className="text-stone-400"> · {m.incomeCount} 笔</span>
                        </span>
                      </div>
                      {totalMemberTx === 0 && (
                        <p className="mt-1 text-[10px] text-stone-400">本区间无记账</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
      <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
      {subtitle ? (
        <p className="mt-1 text-[11px] leading-relaxed text-stone-500">{subtitle}</p>
      ) : null}
      <div className="mt-2">{children}</div>
    </section>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "income" | "expense" | "balance";
}) {
  const toneClass =
    tone === "income"
      ? "text-emerald-700"
      : tone === "expense"
        ? "text-rose-700"
        : value >= 0
          ? "text-emerald-700"
          : "text-rose-700";
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50/90 px-3 py-2.5">
      <p className="text-[11px] font-medium text-stone-500">{label}</p>
      <p className={`mt-0.5 text-base font-bold tabular-nums ${toneClass}`}>
        {formatMoney(value)}
      </p>
    </div>
  );
}

function CategoryDetailList({
  rows,
  total,
  colorAtIndex,
}: {
  rows: { name: string; value: number; count: number }[];
  total: number;
  colorAtIndex: (i: number) => string;
}) {
  return (
    <div className="mt-3 border-t border-stone-100 pt-3">
      <p className="text-xs font-semibold text-stone-700">明细列表</p>
      <ul className="mt-2 space-y-2">
        {rows.map((row, i) => (
          <li
            key={row.name}
            className="flex items-start gap-2 rounded-lg bg-stone-50/90 px-2.5 py-2 text-[12px]"
          >
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: colorAtIndex(i) }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-stone-800">{row.name}</span>
                <span className="shrink-0 font-semibold tabular-nums text-stone-900">
                  {formatMoney(row.value)}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-stone-500">
                <span>占{total > 0 ? formatPercent(row.value, total) : "0%"}</span>
                <span className="text-stone-300">·</span>
                <span>{row.count} 笔</span>
                <span className="text-stone-300">·</span>
                <span>
                  单笔均额{" "}
                  {row.count > 0 ? formatMoney(row.value / row.count) : formatMoney(0)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty() {
  return (
    <p className="py-10 text-center text-sm text-stone-500">该维度下暂无数据</p>
  );
}
