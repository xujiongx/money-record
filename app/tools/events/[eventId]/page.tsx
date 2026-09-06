import { notFound } from "next/navigation";
import { SetupPrompt } from "@/components/features/household/SetupPrompt";
import { EventDetailClient } from "@/components/features/tools/events/EventDetailClient";
import { fetchMajorEventBundle, fetchMajorEventCategories } from "@/app/actions/major-events";
import { fetchMembers } from "@/app/actions/ledger";

export default async function MajorEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  let bundle;
  let members;
  let categories;
  try {
    [bundle, members, categories] = await Promise.all([
      fetchMajorEventBundle(eventId),
      fetchMembers(),
      fetchMajorEventCategories(),
    ]);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "无法连接数据库，请检查环境变量与迁移脚本。";
    return <SetupPrompt message={message} />;
  }

  if (!bundle) notFound();

  return (
    <EventDetailClient
      event={bundle.event}
      expenses={bundle.expenses}
      members={members}
      categories={categories}
    />
  );
}
