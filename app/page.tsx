import { DashboardClient } from "@/components/features/record/DashboardClient";
import { SetupPrompt } from "@/components/features/household/SetupPrompt";
import {
  fetchLedgerCategories,
  fetchMembers,
  fetchTransactions,
} from "@/app/actions/ledger";
import { getHouseholdCodeFromCookies } from "@/lib/household/server";

export default async function HomePage() {
  const householdCode = (await getHouseholdCodeFromCookies()) ?? "";
  let members;
  let transactions;
  let categories;
  try {
    [members, transactions, categories] = await Promise.all([
      fetchMembers(),
      fetchTransactions(),
      fetchLedgerCategories(),
    ]);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "无法连接数据库，请检查环境变量与迁移脚本。";
    return <SetupPrompt message={message} />;
  }

  return (
    <DashboardClient
      householdCode={householdCode}
      initialMembers={members}
      initialTransactions={transactions}
      categories={categories}
    />
  );
}
