import { StatsCharts } from "@/components/StatsCharts";
import { SetupPrompt } from "@/components/SetupPrompt";
import { fetchMembers, fetchTransactions } from "@/app/actions/ledger";
import { getHouseholdCodeFromCookies } from "@/lib/household-server";

export default async function StatsPage() {
  const householdCode = (await getHouseholdCodeFromCookies()) ?? "";
  let members;
  let transactions;
  try {
    [members, transactions] = await Promise.all([
      fetchMembers(),
      fetchTransactions(),
    ]);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "无法连接数据库，请检查环境变量与迁移脚本。";
    return <SetupPrompt message={message} />;
  }

  return (
    <StatsCharts
      householdCode={householdCode}
      transactions={transactions}
      members={members}
    />
  );
}
