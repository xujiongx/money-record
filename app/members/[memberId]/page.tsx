import { notFound } from "next/navigation";
import { MemberLedgerClient } from "@/components/features/members/MemberLedgerClient";
import { SetupPrompt } from "@/components/features/household/SetupPrompt";
import {
  fetchMembers,
  fetchMemberTransactionsPage,
} from "@/app/actions/ledger";
import { getHouseholdCodeFromCookies } from "@/lib/household-server";

const PAGE_SIZE = 10;

export default async function MemberLedgerPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const householdCode = (await getHouseholdCodeFromCookies()) ?? "";

  let members;
  try {
    members = await fetchMembers();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "无法连接数据库，请检查环境变量与迁移脚本。";
    return <SetupPrompt message={message} />;
  }

  const member = members.find((m) => m.id === memberId);
  if (!member) {
    notFound();
  }

  let firstPage;
  try {
    firstPage = await fetchMemberTransactionsPage(memberId, 0, PAGE_SIZE);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "无法加载账单列表。";
    return <SetupPrompt message={message} />;
  }

  return (
    <MemberLedgerClient
      key={memberId}
      householdCode={householdCode}
      memberId={memberId}
      member={member}
      initialMembers={members}
      initialItems={firstPage.items}
      initialHasMore={firstPage.hasMore}
    />
  );
}
