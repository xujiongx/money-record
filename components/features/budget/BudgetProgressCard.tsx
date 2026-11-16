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
}: {
  progress: BudgetProgress | null;
  compact?: boolean;
  /** 未设预算时是否显示轻入口 */
  showSetupLink?: boolean;
}) {
  if (!progress) {
    if (!showSetupLink) return null;
    return (
      <p className="mt-3 text-xs text-[color:var(--muted)]">
        还没设本月预算 ·{" "}
        <Link href="/tools/budget" className="font-bold text-accent underline-offset-2 hover:underline">
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

  return (
    <div className={compact ? "mt-3" : "mt-4"}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <p className="font-bold text-[color:var(--muted)]">本月预算</p>
        <p className="tabular-nums text-ink">
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
      <div className="progress-track mt-2" aria-hidden>
        <div
          className={`progress-fill ${fillClass}`}
          style={{
            width: `${Math.max(4, Math.min(progress.ratio * 100, 100))}%`,
          }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
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
        </p>
        <Link
          href="/tools/budget"
          className="shrink-0 font-bold text-accent underline-offset-2 hover:underline"
        >
          改预算
        </Link>
      </div>
      {alertText ? (
        <p
          className={`mt-1 text-[11px] font-semibold ${
            progress.alert === "over" ? "text-expense" : "text-accent"
          }`}
        >
          {alertText}
        </p>
      ) : null}
    </div>
  );
}
