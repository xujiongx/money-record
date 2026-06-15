import { SetupPrompt } from "@/components/features/household/SetupPrompt";
import { AnalysisClient } from "@/components/features/stats/AnalysisClient";
import { fetchTransactions } from "@/app/actions/ledger";

export default async function AnalysisPage() {
  let transactions;
  try {
    transactions = await fetchTransactions();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "无法连接数据库，请检查环境变量与迁移脚本。";
    return <SetupPrompt message={message} />;
  }

  return <AnalysisClient transactions={transactions} />;
}
