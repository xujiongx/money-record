import { DashboardClient } from "@/components/features/record/DashboardClient";
import { SetupPrompt } from "@/components/features/household/SetupPrompt";
import { fetchHouseholdMonthBudget } from "@/app/actions/budget";
import {
  fetchLedgerCategories,
  fetchMembers,
  fetchTransactions,
} from "@/app/actions/ledger";
import { monthPeriodKey } from "@/lib/budget/period";

export default async function HomePage() {
  let members;
  let transactions;
  let categories;
  let monthBudgetAmount: number | null = null;
  try {
    [members, transactions, categories] = await Promise.all([
      fetchMembers(),
      fetchTransactions(),
      fetchLedgerCategories(),
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
    <DashboardClient
      initialMembers={members}
      initialTransactions={transactions}
      categories={categories}
      monthBudgetAmount={monthBudgetAmount}
    />
  );
}
