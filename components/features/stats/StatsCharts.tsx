"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
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
import { MascotIllustration } from "@/components/common/MascotIllustration";
import { AnalysisDailyTrendChart } from "@/components/features/stats/AnalysisDailyTrendChart";
import { PeriodInsights } from "@/components/features/stats/PeriodInsights";
import { BudgetProgressCard } from "@/components/features/budget/BudgetProgressCard";
import { fetchHouseholdMonthBudget } from "@/app/actions/budget";
import { monthPeriodKey } from "@/lib/budget/period";
import { computeBudgetProgress } from "@/lib/budget/progress";
import { useThemeChartColors } from "@/lib/theme/useThemeChartColors";

const PERIOD_TABS: { id: StatsPeriod; label: string }[] = [
  { id: "day", label: "日" },
  { id: "week", label: "周" },
  { id: "month", label: "月" },
  { id: "year", label: "年" },
];

export function StatsCharts({
  transactions,
  members,
  monthBudgetAmount = null,
}: {
  transactions: TransactionRow[];
  members: MemberRow[];
  /** 自然「本月」全家总预算；切换到其他月时会再拉取 */
  monthBudgetAmount?: number | null;
}) {
  const [period, setPeriod] = useState<StatsPeriod>("month");
  /** 当前统计区间锚点（切换日/周/月/年时用「今天」重置） */
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [budgetAmount, setBudgetAmount] = useState<number | null>(
    monthBudgetAmount,
  );
  const { series: insightColors } = useThemeChartColors();
  const viewMonthKey = monthPeriodKey(anchorDate);
  const currentMonthKey = monthPeriodKey();

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

  useEffect(() => {
    setBudgetAmount(monthBudgetAmount);
  }, [monthBudgetAmount]);

  useEffect(() => {
    if (period !== "month") return;
    if (viewMonthKey === currentMonthKey) {
      setBudgetAmount(monthBudgetAmount);
      return;
    }
    let cancelled = false;
    void fetchHouseholdMonthBudget(viewMonthKey)
      .then((row) => {
        if (!cancelled) setBudgetAmount(row?.amount ?? null);
      })
      .catch(() => {
        if (!cancelled) setBudgetAmount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [period, viewMonthKey, currentMonthKey, monthBudgetAmount]);

  const periodSummary = useMemo(
    () => summarizeLedger(scopedTransactions),
    [scopedTransactions],
  );
  const txCount = scopedTransactions.length;

  const memberDetail = useMemo(
    () => memberPeriodBreakdown(scopedTransactions, members),
    [scopedTransactions, members],
  );

  return (
    <div className="space-y-4">
      <header className="relative flex items-start justify-between gap-3 px-0.5 pr-[5.5rem]">
        <div className="min-w-0">
          <h1 className="page-title text-[1.65rem]">月度统计</h1>
        </div>
        <div className="relative z-[1] flex items-center gap-2">
          <Link
            href="/stats/analysis"
            className="pressable shrink-0 rounded-full bg-accent-soft/80 px-3.5 py-2 text-sm font-extrabold text-accent hover:bg-accent-soft"
          >
            分析
          </Link>
        </div>
        <MascotIllustration
          name="statsHeader"
          size="header"
          className="absolute -right-1 -top-2"
          alt=""
        />
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

        <div className="mt-3 flex items-center gap-1">
          <button
            type="button"
            aria-label="上一时间段"
            onClick={() =>
              setAnchorDate((a) => shiftStatsAnchor(period, a, -1))
            }
            className="pressable flex size-10 shrink-0 items-center justify-center rounded-full text-ink hover:bg-accent-soft/50"
          >
            <ChevronLeft className="size-5" strokeWidth={2.25} aria-hidden />
          </button>
          <p className="min-w-0 flex-1 text-center text-sm font-extrabold leading-snug text-ink">
            {periodLabel}
          </p>
          <button
            type="button"
            aria-label="下一时间段"
            onClick={() =>
              setAnchorDate((a) => shiftStatsAnchor(period, a, 1))
            }
            className="pressable flex size-10 shrink-0 items-center justify-center rounded-full text-ink hover:bg-accent-soft/50"
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
          <div className="rounded-[var(--radius-card)] px-3 py-2.5 ring-1 ring-[var(--line)]">
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
        {period === "month" ? (
          <BudgetProgressCard
            compact
            progress={
              budgetAmount != null && budgetAmount > 0
                ? computeBudgetProgress(periodSummary.expense, budgetAmount)
                : null
            }
            showSetupLink={
              viewMonthKey === currentMonthKey && budgetAmount == null
            }
          />
        ) : (
          <p className="mt-3 text-[11px] text-[color:var(--muted)]">
            预算按自然月计算，切换到「月」可查看进度
          </p>
        )}
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
                        <span className="text-[color:var(--muted)]">
                          {" "}
                          {m.expenseCount} 笔
                        </span>
                      </span>
                      <span>
                        收入 {formatMoney(m.income)}
                        <span className="text-[color:var(--muted)]">
                          {" "}
                          {m.incomeCount} 笔
                        </span>
                      </span>
                    </div>
                    <p className="mt-1.5 flex items-center justify-center gap-0.5 text-xs font-medium text-accent">
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
                        <span className="text-[color:var(--muted)]">
                          {" "}
                          {m.expenseCount} 笔
                        </span>
                      </span>
                      <span>
                        收入 {formatMoney(m.income)}
                        <span className="text-[color:var(--muted)]">
                          {" "}
                          {m.incomeCount} 笔
                        </span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[color:var(--muted)]">
                      本区间无记账
                    </p>
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
        period={period}
      />

      {/* 区间洞察：随日/周/月/年换模块；勿用时间戳 key 以免 Recharts 重挂载 */}
      <PeriodInsights
        period={period}
        transactions={scopedTransactions}
        members={members}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        colors={insightColors}
      />
    </div>
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
    <div className="rounded-[var(--radius-card)] px-3 py-2.5 ring-1 ring-[var(--line)]">
      <p className="text-[11px] font-bold text-[color:var(--muted)]">{label}</p>
      <p className={`mt-0.5 text-base font-extrabold tabular-nums ${toneClass}`}>
        {formatMoney(value)}
      </p>
    </div>
  );
}
