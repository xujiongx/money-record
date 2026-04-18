"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** 底部导航四个 Tab，与 `MobileShell` 中 `tabs` 一致 */
const APP_TAB_HREFS = ["/", "/record", "/stats", "/members"] as const;

/**
 * 预取四个 Tab 的完整 RSC（与底部 `Link prefetch` 一致）。
 * 动态路由默认只预取到 loading 边界；硬刷新后客户端缓存为空，需尽快拉满才能在 `staleTimes.dynamic` 窗口内复用。
 */
export function usePrefetchAppTabs(): void {
  const router = useRouter();
  const pathname = usePathname();
  const enabled = !pathname.startsWith("/login");

  useEffect(() => {
    if (!enabled) return;

    const prefetchAll = () => {
      for (const href of APP_TAB_HREFS) {
        router.prefetch(href);
      }
    };

    prefetchAll();

    let idleId = 0;
    let timeoutId = 0;
    if (typeof requestIdleCallback !== "undefined") {
      idleId = requestIdleCallback(prefetchAll, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(prefetchAll, 600);
    }

    return () => {
      if (idleId) cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [enabled, router]);
}
