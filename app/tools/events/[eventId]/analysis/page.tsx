import { notFound } from "next/navigation";
import { SetupPrompt } from "@/components/features/household/SetupPrompt";
import { EventAnalysisClient } from "@/components/features/tools/events/EventAnalysisClient";
import { fetchMajorEventBundle } from "@/app/actions/major-events";
import { fetchMembers } from "@/app/actions/ledger";

export default async function MajorEventAnalysisPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  let bundle;
  let members;
  try {
    [bundle, members] = await Promise.all([
      fetchMajorEventBundle(eventId),
      fetchMembers(),
    ]);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "无法连接数据库，请检查环境变量与迁移脚本。";
    return <SetupPrompt message={message} />;
  }

  if (!bundle) notFound();

  return (
    <EventAnalysisClient
      event={bundle.event}
      expenses={bundle.expenses}
      members={members}
    />
  );
}
