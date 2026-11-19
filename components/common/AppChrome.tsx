"use client";

import { usePathname } from "next/navigation";
import { MobileShell } from "@/components/common/MobileShell";
import { SsgoiProvider } from "@/app/ssgoi-provider";

/**
 * 账本页：max-w-md 手机壳；/admin：全宽，交给 Astryx AppShell。
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return children;
  }

  return (
    <div className="paper-texture relative z-0 mx-auto min-h-dvh w-full min-w-0 max-w-md overflow-x-clip shadow-sm shadow-stone-900/5">
      <SsgoiProvider>
        <MobileShell>{children}</MobileShell>
      </SsgoiProvider>
    </div>
  );
}
