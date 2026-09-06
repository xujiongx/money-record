import { SetupPrompt } from "@/components/features/household/SetupPrompt";
import { EventsListClient } from "@/components/features/tools/events/EventsListClient";
import { fetchMajorEvents } from "@/app/actions/major-events";

export default async function MajorEventsPage() {
  let events;
  try {
    events = await fetchMajorEvents();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "无法连接数据库，请检查环境变量与迁移脚本。";
    return <SetupPrompt message={message} />;
  }

  return <EventsListClient events={events} />;
}
