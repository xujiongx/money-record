import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

/**
 * 管理后台：在 neutral 上压低阴影、略收圆角，偏扁平商业控制台。
 * 不改 astryx-themes 生成文件；仅 /admin 经 AdminAstryxProvider 使用。
 */
export const adminTheme = defineTheme({
  name: "admin",
  extends: neutralTheme,
  radius: { base: 4, multiplier: 1 },
  tokens: {
    "--radius-inner": "4px",
    "--radius-element": "6px",
    "--radius-container": "8px",
    "--radius-page": "12px",
    "--shadow-low":
      "0 1px 2px light-dark(oklch(0 0 0 / 4%), oklch(0 0 0 / 20%)), 0 0 0 1px light-dark(oklch(0 0 0 / 4%), oklch(1 0 0 / 8%))",
    "--shadow-med":
      "0 2px 6px light-dark(oklch(0 0 0 / 6%), oklch(0 0 0 / 28%)), 0 0 0 1px light-dark(oklch(0 0 0 / 5%), oklch(1 0 0 / 10%))",
    "--shadow-high":
      "0 8px 24px light-dark(oklch(0 0 0 / 8%), oklch(0 0 0 / 40%)), 0 0 0 1px light-dark(oklch(0 0 0 / 6%), oklch(1 0 0 / 12%))",
  },
});
