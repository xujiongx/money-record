import { SetupPrompt } from "@/components/features/household/SetupPrompt";
import { EventCategoriesClient } from "@/components/features/tools/events/EventCategoriesClient";
import { fetchMajorEventCategories } from "@/app/actions/major-events";

export default async function MajorEventCategoriesPage() {
  let categories;
  try {
    categories = await fetchMajorEventCategories();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "无法连接数据库，请检查环境变量与迁移脚本。";
    return <SetupPrompt message={message} />;
  }

  return <EventCategoriesClient categories={categories} />;
}
