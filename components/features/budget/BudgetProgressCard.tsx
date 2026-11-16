"use client";

import Link from "next/link";
import {
  budgetAlertLabel,
  type BudgetProgress,
} from "@/lib/budget/progress";
import { formatMoney } from "@/lib/ledger/format";

export function BudgetProgressCard({
  progress,
  compact = false,
  showSetupLink = false,
  /** 嵌在首页 KPI 内：顶部分隔 + 更疏的行距，避免与主数字抢视线 */
  embedded = false,
}: {
  progress: BudgetProgress | null;
  compact?: boolean;
  /** 未设预算时是否显示轻入口 */
  showSetupLink?: boolean;
  embedded?: boolean;
}) {
  if (!progress) {
    if (!showSetupLink) return null;
    return (
      <p
        className={`text-xs leading-relaxed text-[color:var(--muted)] ${
          embedded ? "border-t border-[var(--line)] pt-4" : "mt-3"
        }`}
      >
        还没设本月全家预算。定个上限，首页就能看到还剩多少 ·{" "}
        <Link
          href="/tools/budget"
          className="font-bold text-accent underline-offset-2 hover:underline"
        >
          去设置
        </Link>
      </p>
    );
  }

  const alertText = budgetAlertLabel(progress.alert);
  const fillClass =
    progress.alert === "over"
      ? "bg-expense"
      : progress.alert === "near"
        ? "bg-accent"
        : "bg-accent";

  const shellClass = embedded
    ? "border-t border-[var(--line)] pt-4"
    : compact
      ? "mt-3"
      : "mt-4";

  return (
    <div className={shellClass}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-bold text-[color:var(--muted)]">
          本月预算
        </p>
        <p className="min-w-0 text-right text-xs tabular-nums text-ink">
          <span
            className={`font-extrabold ${
              progress.alert === "over" ? "text-expense" : "text-ink"
            }`}
          >
            {formatMoney(progress.spent)}
          </span>
          <span className="text-ink/30"> / </span>
          <span className="font-bold text-ink/70">
            {formatMoney(progress.amount)}
          </span>
        </p>
      </div>
      <div className={`progress-track ${embedded ? "mt-2.5" : "mt-2"}`} aria-hidden>
        <div
          className={`progress-fill ${fillClass}`}
          style={{
            width: `${Math.max(4, Math.min(progress.ratio * 100, 100))}%`,
          }}
        />
      </div>
      <div
        className={`flex items-center justify-between gap-3 ${
          embedded ? "mt-2.5" : "mt-1.5"
        } text-[11px]`}
      >
        <p
          className={
            progress.alert === "over"
              ? "font-semibold text-expense"
              : "text-[color:var(--muted)]"
          }
        >
          {progress.remaining >= 0
            ? `还剩 ${formatMoney(progress.remaining)}`
            : `超支 ${formatMoney(-progress.remaining)}`}
          {alertText ? (
            <span
              className={
                progress.alert === "over" ? "text-expense" : "text-accent"
              }
            >
              {" "}
              · {alertText}
            </span>
          ) : null}
        </p>
        <Link
          href="/tools/budget"
          className="shrink-0 font-bold text-accent underline-offset-2 hover:underline"
        >
          改预算
        </Link>
      </div>
    </div>
  );
}
