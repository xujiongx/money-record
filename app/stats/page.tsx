import { SetupPrompt } from "@/components/features/household/SetupPrompt";
import { StatsChartsGate } from "@/components/features/stats/StatsChartsGate";
import { fetchHouseholdMonthBudget } from "@/app/actions/budget";
import { fetchMembers, fetchTransactions } from "@/app/actions/ledger";
import { monthPeriodKey } from "@/lib/budget/period";

export default async function StatsPage() {
  let members;
  let transactions;
  let monthBudgetAmount: number | null = null;
  try {
    [members, transactions] = await Promise.all([
      fetchMembers(),
      fetchTransactions(),
    ]);
    try {
      const budget = await fetchHouseholdMonthBudget(monthPeriodKey());
      monthBudgetAmount = budget?.amount ?? null;
    } catch {
      monthBudgetAmount = null;
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "无法连接数据库，请检查环境变量与迁移脚本。";
    return <SetupPrompt message={message} />;
  }

  return (
    <StatsChartsGate
      transactions={transactions}
      members={members}
      monthBudgetAmount={monthBudgetAmount}
    />
  );
}
