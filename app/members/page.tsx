import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
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

      <ul className="space-y-4">
        {stats.map(({ member, count, income, expense }) => {
          const mine = transactions
            .filter((t) => t.member_id === member.id)
            .slice(0, 8);
          return (
            <li
              key={member.id}
              className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <MemberAvatar name={member.name} avatarUrl={member.avatar_url} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-stone-800">
                      {member.name}
                    </h2>
                    <p className="text-xs text-stone-500">{count} 笔记账</p>
                    <div className="mt-2 flex gap-3 text-sm">
                      <span className="text-emerald-600">
                        收入 {formatMoney(income)}
                      </span>
                      <span className="text-rose-600">
                        支出 {formatMoney(expense)}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/members/${member.id}`}
                  className="shrink-0 rounded-xl p-2 text-stone-400 ring-1 ring-stone-200/80 transition hover:bg-orange-50 hover:text-orange-600 hover:ring-orange-200"
                  aria-label={`查看 ${member.name} 的全部账单`}
                  title="全部账单"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M8 6h12M8 10h12M8 14h8M8 18h8M4 6h.01M4 10h.01M4 14h.01M4 18h.01"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                </Link>
              </div>
              {mine.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-stone-100 pt-3">
                  {mine.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-stone-600">
                        {t.category} ·{" "}
                        {format(new Date(t.occurred_at), "M月d日 HH:mm", {
                          locale: zhCN,
                        })}
                      </span>
                      <span
                        className={
                          t.type === "income"
                            ? "font-medium text-emerald-600"
                            : "font-medium text-rose-600"
                        }
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatMoney(t.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <section className="pt-2">
        <SwitchHouseholdButton />
      </section>
    </div>
  );
}
