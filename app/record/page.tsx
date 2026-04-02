import { RecordForm } from "@/components/RecordForm";
import { SetupPrompt } from "@/components/SetupPrompt";
import { fetchMembers } from "@/app/actions/ledger";

export default async function RecordPage() {
  let members;
  try {
    members = await fetchMembers();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "无法连接数据库，请检查环境变量与迁移脚本。";
    return <SetupPrompt message={message} />;
  }

  if (members.length === 0) {
    return <SetupPrompt message="未找到家庭成员，请确认已执行数据库种子脚本。" />;
  }

  return <RecordForm members={members} />;
}
