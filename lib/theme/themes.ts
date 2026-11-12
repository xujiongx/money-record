/** 颜色主题：由 `data-theme` + CSS 变量驱动，偏好存 localStorage */

export const THEME_STORAGE_KEY = "money-record:color-theme";

export const THEME_IDS = [
  "warm",
  "clay",
  "moss",
  "ocean",
  "grape",
  "ink",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME_ID: ThemeId = "warm";

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  /** 色点预览：主色 / 辅色 */
  swatch: [string, string];
};

export const THEME_LIST: ThemeMeta[] = [
  { id: "warm", label: "布布暖橙", swatch: ["#f47732", "#ffb347"] },
  { id: "clay", label: "黏土手账", swatch: ["#c45c26", "#8b6b4a"] },
  { id: "moss", label: "苔绿清新", swatch: ["#5f8f6b", "#3f6b4f"] },
  { id: "ocean", label: "海盐蓝", swatch: ["#3b82f6", "#0ea5e9"] },
  { id: "grape", label: "葡萄紫", swatch: ["#a855f7", "#ec4899"] },
  { id: "ink", label: "墨青简约", swatch: ["#334155", "#64748b"] },
];

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && (THEME_IDS as readonly string[]).includes(value);
}

export function normalizeThemeId(value: string | null | undefined): ThemeId {
  return isThemeId(value) ? value : DEFAULT_THEME_ID;
}

/** 供切换时同步浏览器 / PWA 状态栏 */
export const THEME_COLOR_META: Record<ThemeId, string> = {
  warm: "#f47732",
  clay: "#c45c26",
  moss: "#5f8f6b",
  ocean: "#3b82f6",
  grape: "#a855f7",
  ink: "#334155",
};

/** 图表色板：饼图 / 柱图 / 成员色点 */
export type ThemeChartPalette = {
  series: readonly string[];
  /** 每日趋势：支出总额线 */
  trendExpense: string;
  /** 每日趋势：收入总额线 */
  trendIncome: string;
};

export const THEME_CHART_PALETTES: Record<ThemeId, ThemeChartPalette> = {
  warm: {
    series: [
      "#f47732",
      "#ffb347",
      "#52c41a",
      "#67b7ff",
      "#ff4d4f",
      "#ffcc66",
      "#c084fc",
    ],
    trendExpense: "#ff4d4f",
    trendIncome: "#52c41a",
  },
  clay: {
    series: [
      "#c45c26",
      "#8b6b4a",
      "#c4a35a",
      "#a63d40",
      "#3f6b4f",
      "#6b5a4a",
      "#5a6b7a",
    ],
    trendExpense: "#c45c26",
    trendIncome: "#3f6b4f",
  },
  moss: {
    series: [
      "#5f8f6b",
      "#3f6b4f",
      "#84a98c",
      "#b4534a",
      "#52796f",
      "#cad2c5",
      "#2f3e46",
    ],
    trendExpense: "#b4534a",
    trendIncome: "#2f6b45",
  },
  ocean: {
    series: [
      "#3b82f6",
      "#0ea5e9",
      "#38bdf8",
      "#6366f1",
      "#14b8a6",
      "#f59e0b",
      "#f43f5e",
    ],
    trendExpense: "#f97316",
    trendIncome: "#2563eb",
  },
  grape: {
    series: [
      "#a855f7",
      "#ec4899",
      "#c084fc",
      "#f472b6",
      "#8b5cf6",
      "#34d399",
      "#fbbf24",
    ],
    trendExpense: "#ec4899",
    trendIncome: "#7c3aed",
  },
  ink: {
    series: [
      "#334155",
      "#64748b",
      "#475569",
      "#0f766e",
      "#be123c",
      "#94a3b8",
      "#1e293b",
    ],
    trendExpense: "#be123c",
    trendIncome: "#0f766e",
  },
};

export const THEME_CHANGE_EVENT = "money-record:themechange";

export function getThemeChartPalette(themeId: ThemeId): ThemeChartPalette {
  return THEME_CHART_PALETTES[themeId] ?? THEME_CHART_PALETTES[DEFAULT_THEME_ID];
}

export function readDocumentThemeId(): ThemeId {
  if (typeof document === "undefined") return DEFAULT_THEME_ID;
  return normalizeThemeId(document.documentElement.getAttribute("data-theme"));
}

export function applyThemeToDocument(themeId: ThemeId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", themeId);
  const color = THEME_COLOR_META[themeId];
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", color);
  window.dispatchEvent(
    new CustomEvent(THEME_CHANGE_EVENT, { detail: { themeId } }),
  );
}
