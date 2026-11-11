import Link from "next/link";
import { ChevronRight, Settings, Wrench } from "lucide-react";
import { SetupPrompt } from "@/components/features/household/SetupPrompt";
import { SwitchHouseholdButton } from "@/components/features/household/SwitchHouseholdButton";
import { fetchMembers, fetchTransactions } from "@/app/actions/ledger";
import { memberStats, summarizeLedger } from "@/lib/ledger/aggregates";
import { formatMoney } from "@/lib/ledger/format";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { getHouseholdCodeFromCookies } from "@/lib/household/server";

export default async function MembersPage() {
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

  const stats = memberStats(transactions, members);
  const family = summarizeLedger(transactions);

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title text-2xl">成员</h1>
          <p className="mt-1 font-mono text-xs text-stone-500">
            编码 {householdCode}
          </p>
        </div>
        <Link
          href="/members/settings"
          aria-label="设置"
          className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-paper text-ink transition hover:bg-accent-soft active:scale-[0.97]"
        >
          <Settings className="size-4" strokeWidth={2.25} aria-hidden />
        </Link>
      </header>

      <section className="paper-panel p-4">
        <h2 className="text-sm font-semibold text-ink">家里一共</h2>
        <div className="mt-3 grid grid-cols-3 divide-x divide-[var(--line)] text-center">
          <div className="px-1 py-1">
            <p className="text-[11px] text-stone-500">总收入</p>
            <p className="mt-0.5 text-sm font-bold text-income">
              {formatMoney(family.income)}
            </p>
          </div>
          <div className="px-1 py-1">
            <p className="text-[11px] text-stone-500">总支出</p>
            <p className="mt-0.5 text-sm font-bold text-expense">
              {formatMoney(family.expense)}
            </p>
          </div>
          <div className="px-1 py-1">
            <p className="text-[11px] text-stone-500">结余</p>
            <p className="mt-0.5 text-sm font-bold text-accent">
              {formatMoney(family.balance)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-stone-500">
          共 {transactions.length} 笔记账
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between px-0.5">
          <h2 className="text-sm font-semibold text-ink">家里人</h2>
          <p className="text-[11px] text-stone-500">点开看全部账单</p>
        </div>
        <ul className="space-y-2">
          {stats.map(({ member, count, income, expense }) => (
            <li key={member.id}>
              <Link
                href={`/members/${member.id}`}
                className="paper-panel flex items-center gap-3 p-4 transition hover:bg-accent-soft/40 active:scale-[0.99]"
              >
                <MemberAvatar
                  name={member.name}
                  avatarUrl={member.avatar_url}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{member.name}</p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {count} 笔记账
                    <span className="text-stone-300"> · </span>
                    <span className="font-medium text-accent">查看明细</span>
                  </p>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="text-income">+{formatMoney(income)}</p>
                  <p className="text-expense">-{formatMoney(expense)}</p>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-stone-300"
                  strokeWidth={2.25}
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 pt-2">
        <Link
          href="/tools"
          className="paper-panel flex w-full items-center gap-3 py-3.5 pl-4 pr-3 text-sm font-medium text-ink transition hover:bg-accent-soft/40 active:scale-[0.99]"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-paper">
            <Wrench className="size-4" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="flex-1 text-left">更多功能</span>
          <ChevronRight
            className="size-5 shrink-0 text-stone-300"
            strokeWidth={2.25}
            aria-hidden
          />
        </Link>
        <SwitchHouseholdButton />
      </section>
    </div>
  );
}
