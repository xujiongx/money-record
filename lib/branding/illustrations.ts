/**
 * 场景插画（PNG 透明底）
 *
 * 整体布局/交互对齐 `docs/assets` 设计稿；
 * 角色原型：布布=`public/bubu.png`，一二=`public/12.png`
 *（另见 `docs/assets/image copy 4.png` / `image copy 5.png`）
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
