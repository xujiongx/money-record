import Link from "next/link";
import { ChevronRight, Landmark, Wrench } from "lucide-react";
import { SubpageHeader } from "@/components/common/SubpageHeader";

const TOOLS = [
  {
    href: "/tools/events",
    title: "大事记账",
    description: "统计装修、婚礼等大项目的各项支出，按成员区分并查看分析",
    icon: Landmark,
  },
] as const;

export function ToolsHub() {
  return (
    <div className="space-y-5">
      <SubpageHeader backHref="/members" title="更多功能" subtitle="工具箱" />

      <section className="paper-panel p-4">
        <div className="flex items-center gap-2">
          <Wrench className="size-4 text-accent" aria-hidden />
          <h2 className="text-sm font-semibold text-ink">可用工具</h2>
        </div>
        <p className="mt-1 text-xs text-stone-500">
          与日常记账数据隔离，互不影响家庭总账与统计。
        </p>
      </section>

      <ul className="space-y-3">
        {TOOLS.map(({ href, title, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="paper-panel flex items-center gap-3 p-4 transition hover:bg-accent-soft/40 active:scale-[0.99]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-paper">
                <Icon className="size-5" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                  {description}
                </p>
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
    </div>
  );
}
