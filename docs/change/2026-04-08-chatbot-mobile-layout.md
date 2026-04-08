# 2026-04-08：小布浮窗移动端滚动与高度

## 问题

对话面板仅用 `max-h`、中间消息区 `flex-1` 时，在部分移动浏览器上中间区域高度不定，长回复无法在内层滚动，表现为末尾文字被底部输入区挡住。

## 改动（`FloatingChatBot.tsx`）

- 遮罩层增加 `h-full min-h-0`，便于子级用 `max-h-full` 约束在可视区域内。
- 面板使用明确高度 `h-[min(86svh,640px)]`（移动端优先 `svh` 减轻地址栏伸缩），桌面 `sm:h-[min(86dvh,640px)]`，并配合 `max-h-full` 不超过已含 safe-area 的内边距区域。
- 头、错误条、底栏加 `shrink-0`；消息列表保持 `min-h-0 flex-1 overflow-y-auto`，并加 `overscroll-y-contain`、`-webkit-overflow-scrolling: touch`。
- 遮罩 `pt` / `pb` 使用 `max(1rem, env(safe-area-inset-*))`，避免刘海与底部指示条挤压内容。
- 滚到底时机包一层 `requestAnimationFrame`，便于 DOM 更新后再滚动。

## 相关

- [development-guide.md](../development-guide.md) 小布助手说明
