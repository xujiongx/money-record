import { StatsChartsSkeleton } from "@/components/common/StatsChartsSkeleton";

/** 仅统计路由：比根 loading 更贴近本页结构，体积更小 */
export default function StatsLoading() {
  return <StatsChartsSkeleton hint="正在加载数据…" />;
}
