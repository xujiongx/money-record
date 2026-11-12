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
      <div className="relative z-10 min-h-dvh overflow-x-clip">
        <SsgoiRouteBoundary>{children}</SsgoiRouteBoundary>
      </div>
      {showNav && (
        <>
          {/* 正文到底栏的奶油渐隐，避免卡片硬切进 TabBar */}
          <div
            className="tab-bar-scrim fixed bottom-0 left-1/2 z-[15] h-28 w-full max-w-md -translate-x-1/2"
            aria-hidden
          />
          <nav className="tab-bar fixed bottom-[max(0.55rem,env(safe-area-inset-bottom))] left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-[calc(28rem-1.5rem)] -translate-x-1/2 px-1.5 py-1.5">
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
                      className="relative flex min-w-[4.25rem] flex-col items-center gap-0.5 py-1.5 text-[11px] font-bold [-webkit-tap-highlight-color:transparent]"
                    >
                      <span className="relative z-10 flex flex-col items-center gap-0.5">
                        <Icon
                          className={
                            active
                              ? "size-[22px] text-accent"
                              : "size-[22px] text-[color:var(--muted)]"
                          }
                          strokeWidth={active ? 2.4 : 1.85}
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
        </>
      )}
      {showNav && <FloatingChatBot />}
    </>
  );
}
