import Link from "next/link";
import { ChevronRight, Wrench } from "lucide-react";
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
      <header>
        <p className="text-sm font-medium text-white/90">家庭</p>
        <h1 className="mt-1 text-2xl font-bold text-white drop-shadow-sm">
          成员与明细
        </h1>
        <p className="mt-1 font-mono text-xs text-white/80">
          家庭编码 {householdCode}
        </p>
      </header>

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <h2 className="text-sm font-semibold text-stone-800">家庭财务总览</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-emerald-50 py-2">
            <p className="text-[10px] text-emerald-700">总收入</p>
            <p className="mt-0.5 text-sm font-bold text-emerald-800">
              {formatMoney(family.income)}
            </p>
          </div>
          <div className="rounded-xl bg-rose-50 py-2">
            <p className="text-[10px] text-rose-700">总支出</p>
            <p className="mt-0.5 text-sm font-bold text-rose-800">
              {formatMoney(family.expense)}
            </p>
          </div>
          <div className="rounded-xl bg-orange-50 py-2">
            <p className="text-[10px] text-orange-800">结余</p>
            <p className="mt-0.5 text-sm font-bold text-orange-900">
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
          <h2 className="text-sm font-semibold text-stone-800">家庭成员</h2>
          <p className="text-[11px] text-stone-500">点击查看全部账单</p>
        </div>
        <ul className="space-y-3">
          {stats.map(({ member, count, income, expense }) => (
            <li key={member.id}>
              <Link
                href={`/members/${member.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80 transition hover:bg-orange-50/60 hover:ring-orange-200 active:scale-[0.99]"
              >
                <MemberAvatar
                  name={member.name}
                  avatarUrl={member.avatar_url}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-800">{member.name}</p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {count} 笔记账
                    <span className="text-stone-300"> · </span>
                    <span className="font-medium text-orange-600">查看明细</span>
                  </p>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="text-emerald-600">+{formatMoney(income)}</p>
                  <p className="text-rose-600">-{formatMoney(expense)}</p>
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
          className="flex w-full items-center gap-3 rounded-2xl border border-orange-100 bg-white py-3.5 pl-4 pr-3 text-sm font-medium text-stone-700 shadow-sm shadow-orange-500/5 transition hover:bg-orange-50/60 active:scale-[0.99]"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 text-white">
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
