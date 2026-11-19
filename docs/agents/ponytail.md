# Ponytail（Cursor 常驻规则）

本仓库已启用 [Ponytail](https://github.com/DietrichGebert/ponytail) 方案 A：把规则文件放进项目，让 Cursor Agent 按「最懒但靠谱的资深开发」写码——优先复用现有代码与平台能力，少写新代码，但不砍校验、安全、错误处理与可访问性。

## 文件

| 路径 | 作用 |
|------|------|
| [`.cursor/rules/ponytail.mdc`](../../.cursor/rules/ponytail.mdc) | `alwaysApply: true`，每个 Cursor 会话自动加载 |

与本仓库已有的 [`.cursor/rules/karpathy-guidelines.mdc`](../../.cursor/rules/karpathy-guidelines.mdc) 目标相近（少写、少抽象）；可并存。

## 使用

1. **新开一个 Cursor Chat**（已有对话不会立刻吃到新 rule）。
2. 正常提需求即可；Agent 应按最小完整改动实现。
3. 本方案**没有** `/ponytail lite|full|ultra` 档位切换，也没有 `/ponytail-review` 等 slash 命令。若需要档位，见上游 [INSTALL.md · Cursor hooks](https://github.com/DietrichGebert/ponytail/blob/main/INSTALL.md#cursor)（与本 rule 二选一）。

## 卸载

删除 `.cursor/rules/ponytail.mdc` 即可。

## 更新规则正文

```bash
curl -fsSL https://raw.githubusercontent.com/DietrichGebert/ponytail/main/.cursor/rules/ponytail.mdc \
  -o .cursor/rules/ponytail.mdc
```
