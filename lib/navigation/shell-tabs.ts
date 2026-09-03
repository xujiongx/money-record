/** 底部 Tab 一级路由（显示底栏）；其余为二级页或登录 */
export const PRIMARY_TAB_ORDER = ["/", "/record", "/stats", "/members"] as const;

export type PrimaryTabPath = (typeof PRIMARY_TAB_ORDER)[number];

const PRIMARY_TAB_PATHS = new Set<string>(PRIMARY_TAB_ORDER);

export function isPrimaryTabPath(pathname: string): pathname is PrimaryTabPath {
  return PRIMARY_TAB_PATHS.has(pathname);
}
