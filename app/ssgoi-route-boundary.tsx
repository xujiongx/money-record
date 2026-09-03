"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isPrimaryTabPath } from "@/lib/navigation/shell-tabs";

/**
 * pathname 既是 React remount key，也是 SSGOI 匹配 transition 的 id。
 * 每一页自带实色底 + 顶部渐变；底栏 / 小布入口仍在 MobileShell。
 */
export function SsgoiRouteBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showNav = isPrimaryTabPath(pathname);
  const fullBleedGradient = pathname.startsWith("/login");

  return (
    <div
      key={pathname}
      data-ssgoi-transition={pathname}
      className="relative isolate min-h-dvh bg-[#fff7f5]"
    >
      <div
        className={`gradient-header pointer-events-none fixed left-1/2 top-0 z-0 w-full max-w-md -translate-x-1/2 opacity-95 ${
          fullBleedGradient ? "min-h-dvh" : "h-52 rounded-b-[2rem]"
        }`}
        aria-hidden
      />
      <div
        className={`relative z-10 min-w-0 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] ${
          showNav ? "pb-28" : "pb-8"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
