"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dailyMemberTypeSeries } from "@/lib/ledger/daily-breakdown";
import { formatMoney } from "@/lib/ledger/format";
import type { LedgerType, MemberRow, TransactionRow } from "@/lib/ledger/types";
import { useThemeChartColors } from "@/lib/theme/useThemeChartColors";

type ChartTab = LedgerType;

export function AnalysisDailyTrendChart({
  transactions,
  members,
  rangeStart,
  rangeEnd,
}: {
  transactions: TransactionRow[];
  members: MemberRow[];
  rangeStart: Date;
  rangeEnd: Date;
}) {
  const [tab, setTab] = useState<ChartTab>("expense");
  const {
    series: MEMBER_COLORS,
    trendExpense,
    trendIncome,
  } = useThemeChartColors();
  const totalColor = tab === "expense" ? trendExpense : trendIncome;

  const series = useMemo(
    () =>
      dailyMemberTypeSeries(
        transactions,
        members,
        rangeStart,
        rangeEnd,
        tab,
      ),
    [transactions, members, rangeStart, rangeEnd, tab],
  );

  const chartData = useMemo(
    () =>
      series.map((p) => {
        const row: Record<string, string | number> = {
          label: p.label,
          total: Number(p.total.toFixed(2)),
        };
        for (const mem of members) {
          row[mem.id] = Number((p.byMember[mem.id] ?? 0).toFixed(2));
        }
        return row;
      }),
    [series, members],
  );

  const hasAny = useMemo(
    () => chartData.some((r) => Number(r.total) > 0),
    [chartData],
  );

  return (
    <div className="paper-panel p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-stone-800">每日趋势</h2>
          <p className="mt-0.5 text-[11px] text-stone-500">
            按日金额 · 总额与各成员
          </p>
        </div>
        <div className="flex gap-1 rounded-xl bg-stone-100 p-0.5">
          {(["expense", "income"] as ChartTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === t
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500"
              }`}
            >
              {t === "expense" ? "支出" : "收入"}
            </button>
          ))}
        </div>
      </div>

      {!hasAny ? (
        <p className="mt-6 py-8 text-center text-sm text-stone-400">
          本月暂无{tab === "expense" ? "支出" : "收入"}记录
        </p>
      ) : (
        <div className="mt-3 h-56 w-full min-w-0">
          <ResponsiveContainer width="100%" height={224} minWidth={0}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#a8a29e" }}
                tickMargin={6}
                interval="preserveStartEnd"
              />
              <YAxis
                width={40}
                tick={{ fontSize: 10, fill: "#a8a29e" }}
                tickFormatter={(v: number) =>
                  Math.abs(v) >= 10000
                    ? `${(v / 10000).toFixed(1)}万`
                    : String(Math.round(v))
                }
              />
              <Tooltip
                formatter={(value) =>
                  formatMoney(typeof value === "number" ? value : Number(value))
                }
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #fed7aa",
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                iconType="circle"
                iconSize={8}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="总额"
                stroke={totalColor}
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
              {members.map((mem, i) => (
                <Line
                  key={mem.id}
                  type="monotone"
                  dataKey={mem.id}
                  name={mem.name}
                  stroke={MEMBER_COLORS[i % MEMBER_COLORS.length]}
                  strokeWidth={1.75}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{ r: 3 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
