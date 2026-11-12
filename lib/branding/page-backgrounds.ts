/**
 * 各页氛围背景（AI 水彩洗色，奶油系）
 * 仅一级 Tab + 登录；二级页不铺顶图，避免与返回行叠层难看。
 */

export const PAGE_BACKGROUNDS = {
  home: "/illustrations/bg-wash-home.jpg",
  record: "/illustrations/bg-wash-record.jpg",
  stats: "/illustrations/bg-wash-stats.jpg",
  members: "/illustrations/bg-wash-members.jpg",
  login: "/illustrations/bg-wash-login.jpg",
} as const;

export type PageBackgroundKey = keyof typeof PAGE_BACKGROUNDS;

/** 按路由选背景；二级详情页返回 null */
export function resolvePageBackground(pathname: string): {
  src: string;
  variant: "tab" | "login";
} | null {
  if (pathname.startsWith("/login")) {
    return { src: PAGE_BACKGROUNDS.login, variant: "login" };
  }
  if (pathname === "/") {
    return { src: PAGE_BACKGROUNDS.home, variant: "tab" };
  }
  if (pathname === "/record") {
    return { src: PAGE_BACKGROUNDS.record, variant: "tab" };
  }
  if (pathname === "/stats") {
    return { src: PAGE_BACKGROUNDS.stats, variant: "tab" };
  }
  if (pathname === "/members") {
    return { src: PAGE_BACKGROUNDS.members, variant: "tab" };
  }
  return null;
}
