"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, PenLine, Users } from "lucide-react";
import { SsgoiRouteBoundary } from "@/app/ssgoi-route-boundary";
import { FloatingChatBot } from "@/components/features/chat";
import { usePrefetchAppTabs } from "@/components/common/usePrefetchAppTabs";
import { preloadDefaultAvatars } from "@/lib/avatar/bitmap-cache";
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
  useEffect(() => {
    preloadDefaultAvatars();
  }, []);

  return (
    <>
      <div className="relative z-0 min-h-dvh overflow-x-clip">
        <SsgoiRouteBoundary>{children}</SsgoiRouteBoundary>
      </div>
      {showNav && (
        <nav className="tab-bar fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 px-2 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))]">
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
                    className="relative flex min-w-[4.5rem] flex-col items-center gap-0.5 py-1.5 text-[11px] font-bold [-webkit-tap-highlight-color:transparent]"
                  >
                    {active ? (
                      <span
                        className="absolute inset-x-2 -inset-y-0.5 rounded-2xl bg-accent-soft/80"
                        aria-hidden
                      />
                    ) : null}
                    <span className="relative z-10 flex flex-col items-center gap-0.5">
                      <Icon
                        className={
                          active
                            ? "size-[22px] text-accent"
                            : "size-[22px] text-[color:var(--muted)]"
                        }
                        strokeWidth={active ? 2.4 : 1.9}
                        aria-hidden
                      />
                      <span
                        className={
                          active
                            ? "text-accent"
                            : "text-[color:var(--muted)]"
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
