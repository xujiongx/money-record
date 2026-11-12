/**
 * 场景插画路径（PNG 透明底）
 *
 * 角色原型：布布=`public/bubu.png`，一二=`public/12.png`
 * 页级氛围底图见 `lib/branding/page-backgrounds.ts`（水彩洗色 JPG + `.shell-page-bg`）。
 * 布局对齐 `docs/assets` 设计稿。
 */

export const ILLUSTRATIONS = {
  /** 首页「本月已花」卡片右侧 */
  homeKpi: "/illustrations/home-kpi.png",
  /** 首页「今日小结」右侧（一二） */
  dailyTip: "/illustrations/daily-tip.png",
  /** 最近账单空态 */
  emptyNoRecords: "/illustrations/empty-no-records.png",
  /** 统计图表空态（布布放大镜） */
  emptyNoData: "/illustrations/empty-no-data.png",
  /** 记账成功 Toast */
  successSaved: "/illustrations/success-saved.png",
  /** 成员页顶部横幅 */
  familyBanner: "/illustrations/family-banner.png",
  /** 登录页头图 */
  loginHero: "/illustrations/login-hero.png",
} as const;

export type IllustrationKey = keyof typeof ILLUSTRATIONS;
