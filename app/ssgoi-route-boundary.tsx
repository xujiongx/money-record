"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isPrimaryTabPath } from "@/lib/navigation/shell-tabs";

/**
 * pathname 既是 React remount key，也是 SSGOI 匹配 transition 的 id。
 * 一级 Tab：奶油顶洗；登录：橙渐变全屏；二级：交给 SubpageHeader。
 */
export function SsgoiRouteBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showNav = isPrimaryTabPath(pathname);
  const isLogin = pathname.startsWith("/login");

  return (
    <div
      key={pathname}
      data-ssgoi-transition={pathname}
      className="relative isolate min-h-dvh"
    >
      {isLogin ? (
        <div
          className="paper-header-login pointer-events-none fixed left-1/2 top-0 z-0 min-h-dvh w-full max-w-md -translate-x-1/2"
          aria-hidden
        />
      ) : showNav ? (
        <div
          className="paper-header pointer-events-none fixed left-1/2 top-0 z-0 h-56 w-full max-w-md -translate-x-1/2"
          aria-hidden
        />
      ) : null}
      <div
        className={`relative z-10 min-w-0 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] ${
          showNav ? "pb-32" : "pb-8"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
