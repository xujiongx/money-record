/** 底部 Tab 一级路由（显示底栏）；其余为二级页或登录 */
const PRIMARY_TAB_PATHS = new Set(["/", "/record", "/stats", "/members"]);

export function isPrimaryTabPath(pathname: string): boolean {
  return PRIMARY_TAB_PATHS.has(pathname);
}

/** 供 SSGOI `slide({ ordered })` 使用的 Tab 顺序 */
export const PRIMARY_TAB_ORDER = ["/", "/record", "/stats", "/members"] as const;
