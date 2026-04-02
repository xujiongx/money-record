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
import { motion } from "framer-motion";
import { sumByCategory, memberExpenseTotals } from "@/lib/aggregates";
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

  const expenseByCat = useMemo(
    () => sumByCategory(transactions, "expense"),
    [transactions],
  );
  const incomeByCat = useMemo(
    () => sumByCategory(transactions, "income"),
    [transactions],
  );
  const memberBars = useMemo(
    () => memberExpenseTotals(transactions, members),
    [transactions, members],
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

      <ChartCard title="支出分类" delay={0}>
        {expenseByCat.length === 0 ? (
          <Empty />
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
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

      <ChartCard title="收入来源占比" delay={0.05}>
        {incomeByCat.length === 0 ? (
          <Empty />
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
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

      <ChartCard title="成员支出对比" delay={0.1}>
        {memberBars.every((b) => b.total === 0) ? (
          <Empty />
        ) : (
          <div className="h-56 w-full pt-2">
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
                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
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
  );
}

function ChartCard({
  title,
  children,
  delay,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80"
    >
      <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
      <div className="mt-2">{children}</div>
    </motion.section>
  );
}

function Empty() {
  return (
    <p className="py-10 text-center text-sm text-stone-500">暂无数据</p>
  );
}
