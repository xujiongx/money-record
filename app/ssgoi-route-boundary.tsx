"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isPrimaryTabPath } from "@/lib/navigation/shell-tabs";
import { resolvePageBackground } from "@/lib/branding/page-backgrounds";

/**
 * pathname 既是 React remount key，也是 SSGOI 匹配 transition 的 id。
 * 一级 Tab / 登录：水彩氛围底图 + 奶油蒙版渐隐；二级无顶图，仅轻量 SubpageHeader。
 * 页层必须实色底（`bg-background`），否则 drill/slide 叠层会透出上一页。
 */
export function SsgoiRouteBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showNav = isPrimaryTabPath(pathname);
  const pageBg = resolvePageBackground(pathname);

  return (
    <div
      key={pathname}
      data-ssgoi-transition={pathname}
      className="relative isolate min-h-dvh bg-background"
    >
      {pageBg ? (
        <div
          className={
            pageBg.variant === "login"
              ? "shell-page-bg shell-page-bg-login"
              : "shell-page-bg"
          }
          style={{ backgroundImage: `url(${pageBg.src})` }}
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
