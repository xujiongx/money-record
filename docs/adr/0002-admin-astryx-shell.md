# 管理后台用 Astryx，与账本壳隔离

家庭账本 UI 保持移动端 max-w-md + Tailwind/奶油主题；`/admin/**` 单独走 Astryx（`adminTheme` = neutral 扩展：压低 shadow、略收圆角 + AppShell `surface`），全宽桌面壳；Card 默认扁平描边（不用 `elevation=low`）。侧栏「家庭审核」与「运营概览」→ 家庭详情。审核 Cookie/Actions 语义不换；Astryx 的 `data-theme` 仅在管理路由生效。不把 Astryx 铺到记账页。

## Status

accepted

## Considered Options

- 全站换 Astryx — 打翻移动端账本视觉，拒绝
- 另起独立 admin 仓库 — 同期两套部署与共享 Actions 成本高，本轮不做
- 继续手机宽换皮 — 侧栏表格无意义，拒绝
