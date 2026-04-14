/** 将 ISO 时间转为 `<input type="datetime-local">` 所需的本地日期时间字符串（到分钟）。 */
export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
