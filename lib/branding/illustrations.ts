/**
 * 场景插画路径（PNG 透明底）
 *
 * 角色原型：布布=`public/bubu.png`，一二=`public/12.png`
 * 首页 KPI / 今日小结、成员横幅保留既有成品图，不随意替换。
 * 页级氛围底见 `lib/branding/page-backgrounds.ts`。
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
  /** 小布助手空态 */
  chatEmpty: "/illustrations/chat-empty.png",
  /** 记账页标题右上角 */
  recordHeader: "/illustrations/record-header.png",
  /** 统计页标题右上角 */
  statsHeader: "/illustrations/stats-header.png",
} as const;

export type IllustrationKey = keyof typeof ILLUSTRATIONS;
