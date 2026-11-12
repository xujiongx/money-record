import Link from "next/link";
import { ChevronRight, Palette, Tags } from "lucide-react";
import { SubpageHeader } from "@/components/common/SubpageHeader";
import { SwitchHouseholdButton } from "@/components/features/household/SwitchHouseholdButton";
import { getHouseholdCodeFromCookies } from "@/lib/household/server";

const SETTINGS = [
  {
    href: "/members/settings/categories",
    title: "分类设置",
    subtitle: "增删改日常收支分类",
    icon: Tags,
  },
  {
    href: "/members/settings/theme",
    title: "主题设置",
    subtitle: "只改本机外观，不影响账本数据",
    icon: Palette,
  },
] as const;

export default async function SettingsPage() {
  const householdCode = (await getHouseholdCodeFromCookies()) ?? "";

  return (
    <div className="space-y-5">
      <SubpageHeader backHref="/members" title="设置" />

      {householdCode ? (
        <section className="paper-panel px-4 py-3">
          <p className="text-xs font-medium text-stone-500">家庭编码</p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-wider text-ink">
            {householdCode}
          </p>
          <p className="mt-1 text-[11px] text-stone-400">
            分享给家人即可加入同一账本
          </p>
        </section>
      ) : null}

      <ul className="space-y-2">
        {SETTINGS.map(({ href, title, subtitle, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="paper-panel flex items-center gap-3 p-4 transition hover:bg-accent-soft/40 active:scale-[0.99]"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-paper">
                <Icon className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">
                  {title}
                </span>
                <span className="mt-0.5 block text-xs text-stone-500">
                  {subtitle}
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-stone-300"
                strokeWidth={2.25}
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
      <SwitchHouseholdButton />
    </div>
  );
}
