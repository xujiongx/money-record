"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * pathname 既是 React remount key，也是 SSGOI 匹配 transition 的 id。
 * 仅包裹路由页面内容；底栏 / 渐变头 / 小布入口留在 MobileShell 外，作为持久壳层。
 */
export function SsgoiRouteBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} data-ssgoi-transition={pathname}>
      {children}
    </div>
  );
}
