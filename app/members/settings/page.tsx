import Link from "next/link";
import { ChevronRight, Palette, Tags } from "lucide-react";
import { SubpageHeader } from "@/components/common/SubpageHeader";

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

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <SubpageHeader backHref="/members" title="设置" />
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
    </div>
  );
}
