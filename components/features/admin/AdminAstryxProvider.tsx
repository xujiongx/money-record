"use client";

import { useEffect } from "react";
import { Theme } from "@astryxdesign/core/theme";
import { adminTheme } from "@/lib/admin/admin-theme";
import {
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  normalizeThemeId,
} from "@/lib/theme/themes";

/**
 * 仅包住 /admin：挂载管理主题（扁平阴影）；卸载时恢复账本 data-theme。
 */
export function AdminAstryxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    return () => {
      try {
        const stored =
          typeof localStorage !== "undefined"
            ? localStorage.getItem(THEME_STORAGE_KEY)
            : null;
        applyThemeToDocument(normalizeThemeId(stored));
      } catch {
        applyThemeToDocument("warm");
      }
      document.documentElement.removeAttribute("data-astryx-theme");
    };
  }, []);

  return (
    <Theme theme={adminTheme} mode="light">
      {children}
    </Theme>
  );
}
