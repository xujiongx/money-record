"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, PenLine, Users } from "lucide-react";
import { SsgoiRouteBoundary } from "@/app/ssgoi-route-boundary";
import { FloatingChatBot } from "@/components/features/chat";
import { usePrefetchAppTabs } from "@/components/common/usePrefetchAppTabs";
import { isPrimaryTabPath } from "@/lib/navigation/shell-tabs";

const tabs = [
  { href: "/", label: "首页", icon: Home },
  { href: "/record", label: "记账", icon: PenLine },
  { href: "/stats", label: "统计", icon: BarChart3 },
  { href: "/members", label: "成员", icon: Users },
] as const;

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  /** 仅四个一级 Tab 显示底栏；登录与二级详情页隐藏 */
  const showNav = isPrimaryTabPath(pathname);
  usePrefetchAppTabs();

  return (
    <>
      <div className="relative z-0 min-h-dvh overflow-x-clip">
        <SsgoiRouteBoundary>{children}</SsgoiRouteBoundary>
      </div>
      {showNav && (
        <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-white/40 bg-white/85 px-2 pt-2 shadow-[0_-8px_30px_rgba(249,115,22,0.12)] backdrop-blur-md pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <ul className="flex items-center justify-around">
            {tabs.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    prefetch
                    href={href}
                    className="relative flex min-w-[4.25rem] flex-col items-center gap-0.5 py-1 text-xs font-medium [-webkit-tap-highlight-color:transparent]"
                  >
                    {active && (
                      <span
                        className="absolute inset-x-1 -inset-y-0.5 rounded-2xl bg-gradient-to-r from-orange-400/25 to-pink-400/25 transition-opacity duration-150"
                        aria-hidden
                      />
                    )}
                    <span className="relative z-10 flex flex-col items-center gap-0.5">
                      <Icon
                        className={
                          active
                            ? href === "/record" || href === "/members"
                              ? "size-[22px] text-pink-500"
                              : "size-[22px] text-orange-500"
                            : "size-[22px] text-stone-400"
                        }
                        strokeWidth={1.8}
                        aria-hidden
                      />
                      <span
                        className={
                          active
                            ? "bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent"
                            : "text-stone-500"
                        }
                      >
                        {label}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
      {showNav && <FloatingChatBot />}
    </>
  );
}
