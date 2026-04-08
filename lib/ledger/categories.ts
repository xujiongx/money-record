export const EXPENSE_CATEGORIES = [
  "餐饮",
  "购物",
  "住宿",
  "交通",
  "娱乐",
  "还款",
  "旅行",
  "教育",
  "医疗",
  "其他",
] as const;

export const INCOME_CATEGORIES = [
  "工资",
  "奖金",
  "投资",
  "红包",
  "其他",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
