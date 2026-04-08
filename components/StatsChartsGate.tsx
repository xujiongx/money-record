"use client";

import dynamic from "next/dynamic";
import { StatsChartsSkeleton } from "@/components/StatsChartsSkeleton";
import type { MemberRow, TransactionRow } from "@/lib/types";

const StatsChartsLazy = dynamic(
  () =>
    import("@/components/StatsCharts").then((mod) => ({
      default: mod.StatsCharts,
    })),
  {
    ssr: false,
    loading: () => <StatsChartsSkeleton hint="正在加载图表…" />,
  },
);

export function StatsChartsGate(props: {
  householdCode: string;
  transactions: TransactionRow[];
  members: MemberRow[];
}) {
  return <StatsChartsLazy {...props} />;
}
