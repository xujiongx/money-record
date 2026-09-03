/** 将本地 `Date` 格式化为 `YYYY-MM-DDTHH:mm`（到分钟）。 */
export function toDatetimeLocalValueFromDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 将 ISO 时间转为表单本地日期时间字符串（到分钟）。 */
export function toDatetimeLocalValue(iso: string): string {
  return toDatetimeLocalValueFromDate(new Date(iso));
}

/** 解析 `YYYY-MM-DDTHH:mm`；无效则返回 `null`。 */
export function parseDatetimeLocal(value: string): Date | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type QuickDayPreset = "today" | "yesterday" | "dayBeforeYesterday";

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 判断当前值对应今天 / 昨天 / 前天；其它日期返回 `null`。 */
export function matchQuickDayPreset(value: string): QuickDayPreset | null {
  const d = parseDatetimeLocal(value);
  if (!d) return null;
  const today = startOfLocalDay(new Date());
  const selected = startOfLocalDay(d);
  const diffDays = Math.round(
    (today.getTime() - selected.getTime()) / 86_400_000,
  );
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays === 2) return "dayBeforeYesterday";
  return null;
}

/** 快捷改日：保留原时间（无原值则用当前时分）。 */
export function applyQuickDayPreset(
  value: string,
  preset: QuickDayPreset,
): string {
  const prev = parseDatetimeLocal(value) ?? new Date();
  const next = new Date();
  if (preset === "yesterday") next.setDate(next.getDate() - 1);
  if (preset === "dayBeforeYesterday") next.setDate(next.getDate() - 2);
  next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
  return toDatetimeLocalValueFromDate(next);
}
