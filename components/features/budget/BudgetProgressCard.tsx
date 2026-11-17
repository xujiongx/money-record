"use client";

import Link from "next/link";
import {
  computeBudgetPaceInsight,
} from "@/lib/budget/pace";
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
  /** 首页展示预算节奏洞察（一句 + 链到预算页） */
  showPaceInsight = false,
}: {
  progress: BudgetProgress | null;
  compact?: boolean;
  /** 未设预算时是否显示轻入口 */
  showSetupLink?: boolean;
  embedded?: boolean;
  showPaceInsight?: boolean;
}) {
  if (!progress) {
    if (!showSetupLink) return null;
    return (
      <p
        className={`text-xs leading-relaxed text-[color:var(--muted)] ${
          embedded ? "border-t border-[var(--line)] pt-4" : "mt-3"
        }`}
      >
        还没设本月全家预算。定个上限，首页就能看到还剩多少。{" "}
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
  const pace = showPaceInsight
    ? computeBudgetPaceInsight(progress.spent, progress.amount)
    : null;
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

  const paceClass =
    pace?.tone === "over"
      ? "text-expense"
      : pace?.tone === "warn"
        ? "text-accent"
        : "text-[color:var(--muted)]";

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
            ["--progress" as string]: String(
              Math.max(0.04, Math.min(progress.ratio, 1)),
            ),
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
          {alertText && !pace ? (
            <span
              className={
                progress.alert === "over" ? "text-expense" : "text-accent"
              }
            >
              {" "}
              {alertText}
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
      {pace ? (
        <Link
          href="/tools/budget"
          className={`mt-2 block text-xs leading-relaxed underline-offset-2 hover:underline ${paceClass}`}
        >
          {pace.text}
        </Link>
      ) : null}
    </div>
  );
}
