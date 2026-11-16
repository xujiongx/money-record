export type BudgetAlert = "none" | "near" | "over";

export type BudgetProgress = {
  amount: number;
  spent: number;
  remaining: number;
  ratio: number;
  alert: BudgetAlert;
};

/** 已花相对总预算的进度；ratio 上限 1.5 便于进度条展示 */
export function computeBudgetProgress(
  spent: number,
  amount: number,
): BudgetProgress {
  const safeSpent = Math.max(0, spent);
  const safeAmount = Math.max(0, amount);
  const remaining = safeAmount - safeSpent;
  const ratio =
    safeAmount > 0 ? Math.min(safeSpent / safeAmount, 1.5) : safeSpent > 0 ? 1.5 : 0;
  let alert: BudgetAlert = "none";
  if (safeAmount > 0) {
    if (safeSpent >= safeAmount) alert = "over";
    else if (safeSpent >= safeAmount * 0.8) alert = "near";
  }
  return { amount: safeAmount, spent: safeSpent, remaining, ratio, alert };
}

export function budgetAlertLabel(alert: BudgetAlert): string | null {
  if (alert === "near") return "快到上限啦，留意一下开销";
  if (alert === "over") return "已经超预算了，记账不受影响";
  return null;
}
