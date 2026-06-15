"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FloatingChatBot } from "@/components/features/chat";
import { usePrefetchAppTabs } from "@/components/common/usePrefetchAppTabs";

const tabs = [
  { href: "/", label: "首页", icon: HomeIcon },
  { href: "/record", label: "记账", icon: PenIcon },
  { href: "/stats", label: "统计", icon: ChartIcon },
  { href: "/members", label: "成员", icon: PeopleIcon },
] as const;

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/login");
  usePrefetchAppTabs();

  return (
    <>
      <div
        className={`gradient-header pointer-events-none fixed left-1/2 top-0 z-0 w-full max-w-md -translate-x-1/2 opacity-95 ${
          hideNav ? "min-h-dvh" : "h-52 rounded-b-[2rem]"
        }`}
      />
      <main
        className={`relative z-10 min-h-dvh min-w-0 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] ${hideNav ? "pb-8" : "pb-28"}`}
      >
        {children}
      </main>
      {!hideNav && (
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
                    <Icon active={active} />
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
      {!hideNav && <FloatingChatBot />}
    </>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={active ? "text-orange-500" : "text-stone-400"}
      aria-hidden
    >
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PenIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={active ? "text-pink-500" : "text-stone-400"}
      aria-hidden
    >
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={active ? "text-orange-500" : "text-stone-400"}
      aria-hidden
    >
      <path
        d="M4 19V5M9 19v-6M14 19V9M19 19v-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PeopleIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={active ? "text-pink-500" : "text-stone-400"}
      aria-hidden
    >
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
