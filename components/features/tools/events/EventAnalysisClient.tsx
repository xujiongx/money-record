"use client";

import { useMemo } from "react";
import { SubpageHeader } from "@/components/common/SubpageHeader";
import {
  eventCategoryBreakdown,
  eventMemberBreakdown,
  summarizeEventExpenses,
} from "@/lib/events/aggregates";
import type {
  MajorEventExpenseRow,
  MajorEventRow,
} from "@/lib/events/types";
import { formatMoney } from "@/lib/ledger/format";
import type { MemberRow } from "@/lib/ledger/types";

const COLORS = [
  "#fb923c",
  "#f472b6",
  "#fbbf24",
  "#a78bfa",
  "#34d399",
  "#60a5fa",
  "#f87171",
  "#94a3b8",
];

export function EventAnalysisClient({
  event,
  expenses,
  members,
}: {
  event: MajorEventRow;
  expenses: MajorEventExpenseRow[];
  members: MemberRow[];
}) {
  const summary = useMemo(() => summarizeEventExpenses(expenses), [expenses]);
  const categories = useMemo(
    () => eventCategoryBreakdown(expenses),
    [expenses],
  );
  const byMember = useMemo(
    () => eventMemberBreakdown(expenses, members),
    [expenses, members],
  );
  const maxMember = Math.max(...byMember.map((m) => m.total), 1);
  const maxCategory = Math.max(...categories.map((c) => c.value), 1);

  return (
    <div className="space-y-5">
      <SubpageHeader
        backHref={`/tools/events/${event.id}`}
        title="支出分析"
        subtitle={event.title}
      />

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <p className="text-xs font-medium text-stone-500">项目总支出</p>
        <p className="mt-1 text-2xl font-bold text-rose-600">
          {formatMoney(summary.total)}
        </p>
        <p className="mt-1 text-xs text-stone-500">共 {summary.count} 笔记录</p>
      </section>

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <h2 className="text-sm font-semibold text-stone-800">成员对比</h2>
        <p className="mt-1 text-xs text-stone-500">按一二 / 布布等记账人汇总</p>
        <ul className="mt-4 space-y-3">
          {byMember.map((m, i) => {
            const pct =
              summary.total > 0
                ? Math.round((m.total / summary.total) * 100)
                : 0;
            return (
              <li key={m.memberId}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-800">{m.name}</span>
                  <span className="font-semibold text-stone-700">
                    {formatMoney(m.total)}
                    <span className="ml-1 text-xs font-normal text-stone-400">
                      {pct}% · {m.count}笔
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(m.total / maxMember) * 100}%`,
                      backgroundColor: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <h2 className="text-sm font-semibold text-stone-800">分类占比</h2>
        {categories.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">暂无数据</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {categories.map((c, i) => {
              const pct =
                summary.total > 0
                  ? Math.round((c.value / summary.total) * 100)
                  : 0;
              return (
                <li key={c.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-stone-800">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        aria-hidden
                      />
                      {c.name}
                    </span>
                    <span className="font-semibold text-stone-700">
                      {formatMoney(c.value)}
                      <span className="ml-1 text-xs font-normal text-stone-400">
                        {pct}% · {c.count}笔
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(c.value / maxCategory) * 100}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
