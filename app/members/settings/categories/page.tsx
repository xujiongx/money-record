import { SetupPrompt } from "@/components/features/household/SetupPrompt";
import { LedgerCategoriesClient } from "@/components/features/household/LedgerCategoriesClient";
import { fetchLedgerCategories } from "@/app/actions/ledger";

export default async function LedgerCategoriesPage() {
  let categories;
  try {
    categories = await fetchLedgerCategories();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "无法加载分类，请检查环境变量与迁移脚本。";
    return <SetupPrompt message={message} />;
  }

  return <LedgerCategoriesClient categories={categories} />;
}
