"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_THEME_ID,
  THEME_CHANGE_EVENT,
  getThemeChartPalette,
  readDocumentThemeId,
  type ThemeChartPalette,
  type ThemeId,
} from "@/lib/theme/themes";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onTheme = () => onStoreChange();
  window.addEventListener(THEME_CHANGE_EVENT, onTheme);
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onTheme);
    observer.disconnect();
  };
}

function getSnapshot(): ThemeId {
  return readDocumentThemeId();
}

function getServerSnapshot(): ThemeId {
  return DEFAULT_THEME_ID;
}

/** 当前主题的图表色板；切换主题时自动更新 */
export function useThemeChartColors(): ThemeChartPalette {
  const themeId = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return getThemeChartPalette(themeId);
}
