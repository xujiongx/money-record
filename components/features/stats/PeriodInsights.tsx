"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MascotEmpty } from "@/components/common/MascotIllustration";
import {
  categoryBreakdown,
  memberPeriodBreakdown,
} from "@/lib/ledger/aggregates";
import { formatMoney } from "@/lib/ledger/format";
import {
  takeCategoryTop,
  topTransactionsByAmount,
  weekdayExpenseSeries,
  yearMonthExpenseSeries,
} from "@/lib/ledger/period-insights";
import type { StatsPeriod } from "@/lib/ledger/stats-period";
import type { MemberRow, TransactionRow } from "@/lib/ledger/types";

function formatPercent(part: number, total: number) {
  if (total <= 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

export function PeriodInsights({
  period,
  transactions,
  members,
  rangeStart,
  rangeEnd,
  colors,
}: {
  period: StatsPeriod;
  transactions: TransactionRow[];
  members: MemberRow[];
  rangeStart: Date;
  rangeEnd: Date;
  colors: readonly string[];
}) {
  if (period === "day") {
    return (
      <DayInsights
        transactions={transactions}
        colors={colors}
      />
    );
  }
  if (period === "week") {
    return (
      <WeekInsights
        transactions={transactions}
        members={members}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        colors={colors}
      />
    );
  }
  if (period === "year") {
    return (
      <YearInsights
        transactions={transactions}
        members={members}
        rangeStart={rangeStart}
        colors={colors}
      />
    );
  }
  return (
    <MonthInsights
      transactions={transactions}
      members={members}
      colors={colors}
    />
  );
}

function DayInsights({
  transactions,
  colors,
}: {
  transactions: TransactionRow[];
  colors: readonly string[];
}) {
  const ranking = useMemo(
    () => topTransactionsByAmount(transactions, "expense", 8),
    [transactions],
  );
  const cats = useMemo(() => {
    const rows = categoryBreakdown(transactions, "expense");
    return takeCategoryTop(rows, 3);
  }, [transactions]);
  const catTotal = useMemo(
    () => cats.reduce((s, r) => s + r.value, 0),
    [cats],
  );

  return (
    <div className="space-y-5">
      <ChartCard
        title="今日支出榜"
        subtitle={
          ranking.length > 0
            ? `按金额 Top ${ranking.length}`
            : "本区间暂无支出"
        }
      >
        {ranking.length === 0 ? (
          <Empty />
        ) : (
          <ol className="divide-y divide-[var(--line)]">
            {ranking.map((t, i) => {
              const rank = i + 1;
              const dateLabel = format(new Date(t.occurred_at), "HH:mm");
              return (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      rank === 1
                        ? "bg-amber-400 text-paper"
                        : rank === 2
                          ? "bg-stone-300 text-paper"
                          : rank === 3
                            ? "bg-accent text-paper"
                            : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {t.category}
                      {t.note ? (
                        <span className="ml-1 font-normal text-[color:var(--muted)]">
                          {t.note}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[color:var(--muted)]">
                      {t.members?.name ?? "—"}
                      <span className="mx-1 text-ink/20">·</span>
                      {dateLabel}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-expense">
                    -{formatMoney(t.amount)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </ChartCard>

      <ChartCard
        title="今日分类 Top3"
        subtitle={
          cats.length > 0
            ? `支出 ${formatMoney(catTotal)}`
            : "本区间暂无支出分类"
        }
      >
        {cats.length === 0 ? (
          <Empty />
        ) : (
          <CategoryBars rows={cats} total={catTotal} colors={colors} />
        )}
      </ChartCard>
    </div>
  );
}

function WeekInsights({
  transactions,
  members,
  rangeStart,
  rangeEnd,
  colors,
}: {
  transactions: TransactionRow[];
  members: MemberRow[];
  rangeStart: Date;
  rangeEnd: Date;
  colors: readonly string[];
}) {
  const weekdays = useMemo(
    () => weekdayExpenseSeries(transactions, rangeStart, rangeEnd),
    [transactions, rangeStart, rangeEnd],
  );
  const weekTotal = useMemo(
    () => weekdays.reduce((s, d) => s + d.total, 0),
    [weekdays],
  );
  const memberBars = useMemberExpenseBars(transactions, members);
  const cats = useMemo(() => {
    const rows = categoryBreakdown(transactions, "expense");
    return takeCategoryTop(rows, 5);
  }, [transactions]);
  const catTotal = useMemo(
    () => cats.reduce((s, r) => s + r.value, 0),
    [cats],
  );

  return (
    <div className="space-y-5">
      <ChartCard
        title="本周各日支出"
        subtitle={
          weekTotal > 0
            ? `支出合计 ${formatMoney(weekTotal)}`
            : "本周暂无支出"
        }
      >
        {weekTotal <= 0 ? (
          <Empty />
        ) : (
          <SimpleBars data={weekdays} colors={colors} mono />
        )}
      </ChartCard>

      <MemberExpenseCard bars={memberBars} colors={colors} />

      <ChartCard
        title="分类 Top5"
        subtitle={
          cats.length > 0
            ? `支出 ${formatMoney(catTotal)}`
            : "本周暂无支出分类"
        }
      >
        {cats.length === 0 ? (
          <Empty />
        ) : (
          <CategoryBars rows={cats} total={catTotal} colors={colors} />
        )}
      </ChartCard>
    </div>
  );
}

function MonthInsights({
  transactions,
  members,
  colors,
}: {
  transactions: TransactionRow[];
  members: MemberRow[];
  colors: readonly string[];
}) {
  const memberBars = useMemberExpenseBars(transactions, members);
  const expenseRows = useMemo(() => {
    const rows = categoryBreakdown(transactions, "expense");
    return [...rows].sort((a, b) => b.value - a.value);
  }, [transactions]);
  const incomeRows = useMemo(() => {
    const rows = categoryBreakdown(transactions, "income");
    return [...rows].sort((a, b) => b.value - a.value);
  }, [transactions]);
  const expenseTotal = useMemo(
    () => expenseRows.reduce((s, r) => s + r.value, 0),
    [expenseRows],
  );
  const incomeTotal = useMemo(
    () => incomeRows.reduce((s, r) => s + r.value, 0),
    [incomeRows],
  );

  return (
    <div className="space-y-5">
      <MemberExpenseCard bars={memberBars} colors={colors} />

      <ChartCard
        title="支出分类"
        subtitle={
          expenseTotal > 0
            ? `支出合计 ${formatMoney(expenseTotal)}，${expenseRows.length} 个分类`
            : "本月暂无支出"
        }
      >
        {expenseRows.length === 0 ? (
          <Empty />
        ) : (
          <CategoryBars
            rows={expenseRows}
            total={expenseTotal}
            colors={colors}
          />
        )}
      </ChartCard>

      {incomeTotal > 0 ? (
        <ChartCard
          title="收入来源"
          subtitle={`收入合计 ${formatMoney(incomeTotal)}，${incomeRows.length} 个来源`}
        >
          <CategoryBars
            rows={incomeRows}
            total={incomeTotal}
            colors={colors}
            colorOffset={2}
          />
        </ChartCard>
      ) : null}
    </div>
  );
}

function YearInsights({
  transactions,
  members,
  rangeStart,
  colors,
}: {
  transactions: TransactionRow[];
  members: MemberRow[];
  rangeStart: Date;
  colors: readonly string[];
}) {
  const months = useMemo(
    () => yearMonthExpenseSeries(transactions, rangeStart),
    [transactions, rangeStart],
  );
  const yearTotal = useMemo(
    () => months.reduce((s, m) => s + m.total, 0),
    [months],
  );
  const memberBars = useMemberExpenseBars(transactions, members);

  return (
    <div className="space-y-5">
      <ChartCard
        title="各月支出"
        subtitle={
          yearTotal > 0
            ? `全年支出 ${formatMoney(yearTotal)}`
            : "本年暂无支出"
        }
      >
        {yearTotal <= 0 ? (
          <Empty />
        ) : (
          <SimpleBars data={months} colors={colors} mono />
        )}
      </ChartCard>

      <MemberExpenseCard bars={memberBars} colors={colors} />
    </div>
  );
}

function useMemberExpenseBars(
  transactions: TransactionRow[],
  members: MemberRow[],
) {
  return useMemo(() => {
    const detail = memberPeriodBreakdown(transactions, members);
    return detail.map((m) => ({ name: m.name, total: m.expense }));
  }, [transactions, members]);
}

function MemberExpenseCard({
  bars,
  colors,
}: {
  bars: { name: string; total: number }[];
  colors: readonly string[];
}) {
  const total = bars.reduce((s, b) => s + b.total, 0);
  return (
    <ChartCard
      title="成员支出对比"
      subtitle={
        total > 0
          ? `支出合计 ${formatMoney(total)}`
          : "本区间暂无成员支出"
      }
    >
      {total <= 0 ? (
        <Empty />
      ) : (
        <SimpleBars
          data={bars.map((b) => ({
            key: b.name,
            label: b.name,
            total: b.total,
          }))}
          colors={colors}
        />
      )}
    </ChartCard>
  );
}

function SimpleBars({
  data,
  colors,
  mono = false,
}: {
  data: { key: string; label: string; total: number }[];
  colors: readonly string[];
  mono?: boolean;
}) {
  const chartData = data.map((d) => ({ name: d.label, total: d.total }));
  return (
    <div className="h-56 w-full min-h-[224px] min-w-0 pt-1">
      <ResponsiveContainer width="100%" height={224} minWidth={0}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#78716c" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#a8a29e" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `¥${v}`}
          />
          <Tooltip
            formatter={(v) =>
              formatMoney(typeof v === "number" ? v : Number(v) || 0)
            }
            contentStyle={{
              borderRadius: 12,
              border: "none",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}
          />
          <Bar
            isAnimationActive={false}
            dataKey="total"
            name="合计"
            radius={[8, 8, 0, 0]}
          >
            {chartData.map((_, i) => (
              <Cell
                key={i}
                fill={
                  mono
                    ? colors[0] ?? "#f47732"
                    : colors[i % colors.length]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CategoryBars({
  rows,
  total,
  colors,
  colorOffset = 0,
}: {
  rows: { name: string; value: number; count: number }[];
  total: number;
  colors: readonly string[];
  colorOffset?: number;
}) {
  return (
    <ul className="space-y-2.5">
      {rows.map((row, i) => {
        const pct = total > 0 ? (row.value / total) * 100 : 0;
        const color = colors[(i + colorOffset) % colors.length] ?? "#f47732";
        return (
          <li key={row.name} className="min-w-0">
            <div className="flex items-baseline justify-between gap-2 text-[12px]">
              <span className="min-w-0 truncate font-medium text-ink">
                {row.name}
                <span className="ml-1.5 font-normal text-[color:var(--muted)]">
                  {row.count} 笔
                </span>
              </span>
              <span className="shrink-0 tabular-nums text-ink">
                <span className="font-semibold">{formatMoney(row.value)}</span>
                <span className="ml-1.5 text-[11px] text-[color:var(--muted)]">
                  {formatPercent(row.value, total)}
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--line)]">
              <div
                className="h-full origin-left rounded-full"
                style={{
                  width: "100%",
                  transform: `scaleX(${Math.max(0, Math.min(1, pct / 100))})`,
                  backgroundColor: color,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
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
