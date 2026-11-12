"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** 底部导航四个 Tab，与 `MobileShell` 中 `tabs` 一致 */
const APP_TAB_HREFS = ["/", "/record", "/stats", "/members"] as const;

/**
 * 预取四个 Tab 的完整 RSC（与底部 `Link prefetch` 一致）。
 * 动态路由默认只预取到 loading 边界；硬刷新后客户端缓存为空，需尽快拉满才能在 `staleTimes.dynamic` 窗口内复用。
 *
 * Next 16：挂载当下立刻 `router.prefetch` 可能抛
 * “Router action dispatched before initialization”，故延后到 Router 就绪后再预取。
 */
export function usePrefetchAppTabs(): void {
  const router = useRouter();
  const pathname = usePathname();
  const enabled = !pathname.startsWith("/login");

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let idleId = 0;
    let timeoutId = 0;

    const prefetchAll = () => {
      if (cancelled) return;
      for (const href of APP_TAB_HREFS) {
        try {
          router.prefetch(href);
        } catch {
          // Router 尚未初始化时忽略；稍后 idle / 再次触发会重试
        }
      }
    };

    // 等一帧 + 短延迟，避开 App Router 初始化窗口
    timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      prefetchAll();
      if (typeof requestIdleCallback !== "undefined") {
        idleId = requestIdleCallback(prefetchAll, { timeout: 2000 });
      } else {
        timeoutId = window.setTimeout(prefetchAll, 600);
      }
    }, 120);

    return () => {
      cancelled = true;
      if (idleId) cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [enabled, router]);
}
