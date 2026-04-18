import { notFound, redirect } from "next/navigation";
import { StatsMemberPeriodLists } from "@/components/features/stats/StatsMemberPeriodLists";
import { SetupPrompt } from "@/components/features/household/SetupPrompt";
import { fetchMembers, fetchTransactions } from "@/app/actions/ledger";
import { getHouseholdCodeFromCookies } from "@/lib/household/server";
import {
  filterTransactionsInRange,
  formatStatsRangeBounds,
} from "@/lib/ledger/stats-period";
import type { TransactionRow } from "@/lib/ledger/types";

function byOccurredDesc(a: TransactionRow, b: TransactionRow) {
  return new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
}

export default async function StatsMemberPeriodPage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { memberId } = await params;
  const { start: startRaw, end: endRaw } = await searchParams;

  if (!startRaw || !endRaw) {
    redirect("/stats");
  }

  const rangeStart = new Date(startRaw);
  const rangeEnd = new Date(endRaw);
  if (
    Number.isNaN(rangeStart.getTime()) ||
    Number.isNaN(rangeEnd.getTime())
  ) {
    redirect("/stats");
  }

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

  const member = members.find((m) => m.id === memberId);
  if (!member) {
    notFound();
  }

  const inRange = filterTransactionsInRange(
    transactions,
    rangeStart,
    rangeEnd,
  ).filter((t) => t.member_id === memberId);

  const expenses = inRange
    .filter((t) => t.type === "expense")
    .sort(byOccurredDesc);
  const incomes = inRange
    .filter((t) => t.type === "income")
    .sort(byOccurredDesc);

  const rangeBounds = formatStatsRangeBounds(rangeStart, rangeEnd);

  return (
    <StatsMemberPeriodLists
      householdCode={householdCode}
      memberName={member.name}
      rangeBounds={rangeBounds}
      expenses={expenses}
      incomes={incomes}
    />
  );
}
