# 统计页趋势下按周期换「区间洞察」

`/stats` 负责扫一眼当前区间；`/stats/analysis` 负责深挖。趋势图下方不再用同一套成员柱 + 双饼图套所有日/周/月/年，改为随周期切换的**区间洞察**（日：只读笔数榜 + 分类 Top3；周：星期总额柱 + 成员柱 + 分类 Top5 横条；月：成员柱 + 支出/有收入才出的收入横条；年：12 月支出柱不可点 + 成员柱）。分类在统计页统一横条；全年不揉成饼；本轮不改分析页。

## Status

accepted（已实现：`PeriodInsights` + `lib/ledger/period-insights.ts`）

## Considered Options

- 两页都堆满图表（重复、心智乱）— 拒绝
- 统计页吃掉分析页 — 过重，本轮不做
- 三块通用图当附录再叠周期模块 — 日/年维度噪音大 — 拒绝

## Consequences

- `StatsCharts` 趋势下由 `PeriodInsights` 按 `period` 分支渲染
- 分析页结余月历 / 对比 / 排行仍保留；若日后删重复块需另开决策
