import type { LedgerType } from "@/lib/ledger/types";

/** 默认支出分类（新家庭种子 / 迁移补全） */
export const DEFAULT_EXPENSE_CATEGORIES = [
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

/** 默认收入分类（新家庭种子 / 迁移补全） */
export const DEFAULT_INCOME_CATEGORIES = [
  "工资",
  "奖金",
  "投资",
  "红包",
  "其他",
] as const;

/** @deprecated 使用 DEFAULT_EXPENSE_CATEGORIES；保留别名以免遗漏引用 */
export const EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;
/** @deprecated 使用 DEFAULT_INCOME_CATEGORIES */
export const INCOME_CATEGORIES = DEFAULT_INCOME_CATEGORIES;

export const DEFAULT_LEDGER_CATEGORY = "其他";

export type ExpenseCategory = (typeof DEFAULT_EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof DEFAULT_INCOME_CATEGORIES)[number];

export type LedgerCategoryRow = {
  id: string;
  household_id: string;
  type: LedgerType;
  name: string;
  sort_order: number;
  created_at: string;
};

export function normalizeLedgerCategoryName(name: string): string {
  return name.trim();
}

export function defaultCategoryNames(type: LedgerType): readonly string[] {
  return type === "expense"
    ? DEFAULT_EXPENSE_CATEGORIES
    : DEFAULT_INCOME_CATEGORIES;
}

export function categoryNamesForType(
  rows: LedgerCategoryRow[],
  type: LedgerType,
): string[] {
  return rows.filter((r) => r.type === type).map((r) => r.name);
}
