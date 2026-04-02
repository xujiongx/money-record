/** Cookie 与 localStorage 共用键名（值为 6 位数字家庭编码） */
export const HOUSEHOLD_CODE_COOKIE = "ledger_household_code";
export const HOUSEHOLD_CODE_STORAGE_KEY = "ledger_household_code";

/** 从任意输入提取 6 位数字编码，无效则返回 null */
export function normalizeHouseholdCode(raw: string): string | null {
  const digits = raw.replace(/\D/g, "").slice(0, 6);
  return /^\d{6}$/.test(digits) ? digits : null;
}
