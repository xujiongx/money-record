"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** 底部导航四个 Tab，与 `MobileShell` 中 `tabs` 一致 */
const APP_TAB_HREFS = ["/", "/record", "/stats", "/members"] as const;

/**
 * 在浏览器空闲时预取各 Tab 的 RSC payload，减少首次点击切换的等待。
 */
export function usePrefetchAppTabs(): void {
  const router = useRouter();
  const pathname = usePathname();
  const enabled = !pathname.startsWith("/login");

  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      for (const href of APP_TAB_HREFS) {
        router.prefetch(href);
      }
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(run, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const id = window.setTimeout(run, 400);
    return () => window.clearTimeout(id);
  }, [enabled, router]);
}
