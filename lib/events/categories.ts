/** 大事记账默认分类名（新建家庭时唯一初始项） */
export const DEFAULT_MAJOR_EVENT_CATEGORY = "其他";

export function normalizeMajorEventCategoryName(name: string): string {
  return name.trim();
}
