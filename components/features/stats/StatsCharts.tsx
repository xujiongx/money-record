"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  formatStatsRangeBounds,
  getStatsDateRange,
  shiftStatsAnchor,
} from "@/lib/ledger/stats-period";
import { formatMoney } from "@/lib/ledger/format";
import type { MemberRow, TransactionRow } from "@/lib/ledger/types";
import { MascotEmpty } from "@/components/common/MascotIllustration";
import { AnalysisDailyTrendChart } from "@/components/features/stats/AnalysisDailyTrendChart";
import { useThemeChartColors } from "@/lib/theme/useThemeChartColors";

function formatPercent(part: number, total: number) {
  if (total <= 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

const PERIOD_TABS: { id: StatsPeriod; label: string }[] = [
  { id: "day", label: "日" },
  { id: "week", label: "周" },
  { id: "month", label: "月" },
  { id: "year", label: "年" },
];

export function StatsCharts({
  transactions,
  members,
}: {
  transactions: TransactionRow[];
  members: MemberRow[];
}) {
  const [period, setPeriod] = useState<StatsPeriod>("month");
  /** 当前统计区间锚点（切换日/周/月/年时用「今天」重置） */
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const { series: COLORS } = useThemeChartColors();

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
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3 px-0.5">
        <div>
          <h1 className="page-title text-[1.65rem]">月度统计</h1>
        </div>
        <Link
          href="/stats/analysis"
          className="pressable mt-1 shrink-0 rounded-2xl border border-[var(--line)] bg-paper px-3.5 py-2 text-sm font-extrabold text-accent shadow-[var(--shadow-soft)] hover:bg-accent-soft"
        >
          分析
        </Link>
      </header>

      <div className="paper-panel p-3.5">
        <p className="text-center text-xs font-bold text-[color:var(--muted)]">
          看哪一段时间
        </p>
        <div className="segmented mt-2">
          {PERIOD_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setPeriod(id);
                setAnchorDate(new Date());
              }}
              className={`segmented-item ${
                period === id ? "segmented-item-active" : ""
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
            className="pressable flex w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-background text-ink"
          >
            <ChevronLeft className="size-5" strokeWidth={2.25} aria-hidden />
          </button>
          <div className="min-w-0 flex-1 rounded-2xl bg-background px-2 py-2.5">
            <p className="text-center text-sm font-extrabold leading-snug text-ink">
              {periodLabel}
            </p>
          </div>
          <button
            type="button"
            aria-label="下一时间段"
            onClick={() =>
              setAnchorDate((a) => shiftStatsAnchor(period, a, 1))
            }
            className="pressable flex w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-background text-ink"
          >
            <ChevronRight className="size-5" strokeWidth={2.25} aria-hidden />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setAnchorDate(new Date())}
          className="mt-2 w-full rounded-xl py-2 text-xs font-bold text-accent transition hover:bg-accent-soft"
        >
          回到今天
        </button>
      </div>

      <section className="paper-panel p-4">
        <h2 className="text-sm font-extrabold text-ink">本区间汇总</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--muted)]">
          {formatStatsRangeBounds(rangeStart, rangeEnd)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <SummaryTile label="总收入" value={periodSummary.income} tone="income" />
          <SummaryTile label="总支出" value={periodSummary.expense} tone="expense" />
          <SummaryTile label="结余" value={periodSummary.balance} tone="balance" />
          <div className="rounded-2xl bg-background px-3 py-2.5">
            <p className="text-[11px] font-bold text-[color:var(--muted)]">
              记账笔数
            </p>
            <p className="mt-0.5 text-lg font-extrabold tabular-nums text-ink">
              {txCount}
            </p>
            <p className="mt-0.5 text-[10px] text-[color:var(--muted)]">
              收入 + 支出合计
            </p>
          </div>
        </div>
      </section>

      <section className="paper-panel p-4">
        <h2 className="text-sm font-semibold text-stone-800">成员明细（本区间）</h2>
        <p className="mt-1 text-[11px] text-stone-500">
          按成员汇总收支；有记账时可进入区间明细
        </p>
        <ul className="mt-3 space-y-2">
          {memberDetail.map((m) => {
            const net = m.income - m.expense;
            const totalMemberTx = m.expenseCount + m.incomeCount;
            const detailHref =
              `/stats/member/${m.memberId}` +
              `?start=${encodeURIComponent(rangeStart.toISOString())}` +
              `&end=${encodeURIComponent(rangeEnd.toISOString())}`;
            return (
              <li key={m.memberId}>
                {totalMemberTx > 0 ? (
                  <Link
                    href={detailHref}
                    className="block rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2 text-[12px] text-stone-800 transition active:scale-[0.99] hover:border-accent/30 hover:bg-accent-soft/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{m.name}</span>
                      <span
                        className={`shrink-0 text-[11px] font-semibold tabular-nums ${
                          net >= 0 ? "text-income" : "text-expense"
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
                    <p className="mt-1.5 flex items-center justify-center gap-0.5 text-[10px] font-medium text-accent">
                      查看收支明细
                      <ChevronRight className="size-3" strokeWidth={2.5} aria-hidden />
                    </p>
                  </Link>
                ) : (
                  <div className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2 text-[12px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-stone-800">{m.name}</span>
                      <span
                        className={`shrink-0 text-[11px] font-semibold tabular-nums ${
                          net >= 0 ? "text-income" : "text-expense"
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
                    <p className="mt-1 text-[10px] text-stone-400">本区间无记账</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <AnalysisDailyTrendChart
        transactions={scopedTransactions}
        members={members}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
      />

      {/* 不要用含时间戳的 key，否则每次切期都会卸载整块 Recharts，ResponsiveContainer 重测 DOM 很慢 */}
      <div className="space-y-5">
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
        </ChartCard>

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
    <section className="paper-panel p-4">
      <h2 className="text-sm font-extrabold text-ink">{title}</h2>
      {subtitle ? (
        <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--muted)]">
          {subtitle}
        </p>
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
      ? "text-income"
      : tone === "expense"
        ? "text-expense"
        : value >= 0
          ? "text-accent"
          : "text-expense";
  return (
    <div className="rounded-2xl bg-background px-3 py-2.5">
      <p className="text-[11px] font-bold text-[color:var(--muted)]">{label}</p>
      <p className={`mt-0.5 text-base font-extrabold tabular-nums ${toneClass}`}>
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
    <MascotEmpty
      name="emptyNoData"
      title="暂无数据"
      description="换个时间段，或先去记一笔吧"
      className="py-4"
    />
  );
}
