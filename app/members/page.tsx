import Link from "next/link";
import {
  ChevronRight,
  FolderTree,
  Palette,
  Settings,
  Wrench,
} from "lucide-react";
import { SetupPrompt } from "@/components/features/household/SetupPrompt";
import { fetchMembers, fetchTransactions } from "@/app/actions/ledger";
import { memberStats, summarizeLedger } from "@/lib/ledger/aggregates";
import { formatMoney } from "@/lib/ledger/format";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { MascotIllustration } from "@/components/common/MascotIllustration";

const moreLinks = [
  {
    href: "/tools",
    label: "更多工具",
    hint: "大事记账等",
    icon: Wrench,
    tone: "bg-[#FFE4D1] text-[#F47732]",
  },
  {
    href: "/members/settings/categories",
    label: "分类管理",
    hint: "日常收支分类",
    icon: FolderTree,
    tone: "bg-[#DFF3E6] text-[#52C41A]",
  },
  {
    href: "/members/settings/theme",
    label: "主题颜色",
    hint: "本机偏好",
    icon: Palette,
    tone: "bg-[#EDE4FF] text-[#9B7BFF]",
  },
  {
    href: "/members/settings",
    label: "家庭设置",
    hint: "编码与切换",
    icon: Settings,
    tone: "bg-[#DCECFF] text-[#67B7FF]",
  },
] as const;

export default async function MembersPage() {
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
    <div className="space-y-4">
      <header className="px-0.5">
        <h1 className="page-title text-[1.65rem]">我们的家庭账本</h1>
      </header>

      {/* 设计稿：家庭横幅 + 三列汇总；同一连续底，避免色块交界出假线 */}
      <section className="paper-panel overflow-hidden bg-gradient-to-b from-accent-soft/55 via-paper to-paper px-2 pb-3.5 pt-4">
        <div className="flex justify-center px-2">
          <MascotIllustration name="familyBanner" size="banner" alt="" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1 text-center">
          <div className="px-1">
            <p className="text-[11px] text-[color:var(--muted)]">总收入</p>
            <p className="mt-1 text-sm font-extrabold tabular-nums text-income">
              {formatMoney(family.income)}
            </p>
          </div>
          <div className="px-1">
            <p className="text-[11px] text-[color:var(--muted)]">总支出</p>
            <p className="mt-1 text-sm font-extrabold tabular-nums text-expense">
              {formatMoney(family.expense)}
            </p>
          </div>
          <div className="px-1">
            <p className="text-[11px] text-[color:var(--muted)]">结余</p>
            <p className="mt-1 text-sm font-extrabold tabular-nums text-accent">
              {formatMoney(family.balance)}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="px-0.5 text-sm font-extrabold text-ink">家里人</h2>
        <ul className="space-y-2.5">
          {stats.map(({ member, count, income, expense }) => (
            <li key={member.id}>
              <Link
                href={`/members/${member.id}`}
                className="paper-panel pressable flex items-center gap-3 p-4 hover:bg-accent-soft/35"
              >
                <MemberAvatar
                  name={member.name}
                  avatarUrl={member.avatar_url}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-ink">{member.name}</p>
                  <p className="mt-0.5 text-xs text-[color:var(--muted)]">
                    {count} 笔记账
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="progress-track h-1.5">
                      <div
                        className="progress-fill !bg-expense"
                        style={{
                          width: `${Math.min(
                            100,
                            family.expense > 0
                              ? (expense / family.expense) * 100
                              : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="font-bold text-income">+{formatMoney(income)}</p>
                  <p className="font-bold text-expense">-{formatMoney(expense)}</p>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-[color:var(--muted)]"
                  strokeWidth={2.25}
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 设计稿：更多功能四宫格 */}
      <section className="space-y-3 pt-1">
        <h2 className="px-0.5 text-sm font-extrabold text-ink">更多功能</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {moreLinks.map(({ href, label, hint, icon: Icon, tone }) => (
            <Link
              key={href}
              href={href}
              className="paper-panel pressable flex items-center gap-3 p-3.5 hover:bg-accent-soft/30"
            >
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}
              >
                <Icon className="size-5" strokeWidth={2.2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-ink">
                  {label}
                </span>
                <span className="mt-0.5 block text-[11px] text-[color:var(--muted)]">
                  {hint}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
