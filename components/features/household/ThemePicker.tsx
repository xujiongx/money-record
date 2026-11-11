"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  DEFAULT_THEME_ID,
  THEME_LIST,
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  normalizeThemeId,
  type ThemeId,
} from "@/lib/theme/themes";

/** 二级页主题列表：点选即生效并写入本机偏好 */
export function ThemePicker() {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      const next = normalizeThemeId(stored);
      setThemeId(next);
      applyThemeToDocument(next);
    } catch {
      applyThemeToDocument(DEFAULT_THEME_ID);
    }
    setReady(true);
  }, []);

  const onSelect = (id: ThemeId) => {
    setThemeId(id);
    applyThemeToDocument(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // private mode
    }
  };

  return (
    <ul className="space-y-2" aria-label="颜色主题">
      {THEME_LIST.map(({ id, label, swatch }) => {
        const active = ready && themeId === id;
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onSelect(id)}
              aria-pressed={active}
              className={`paper-panel flex w-full items-center gap-3 p-4 text-left transition active:scale-[0.99] ${
                active
                  ? "border-accent bg-accent-soft/50"
                  : "hover:bg-accent-soft/40"
              }`}
            >
              <span
                className="relative flex h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-black/5"
                aria-hidden
              >
                <span
                  className="h-full w-1/2"
                  style={{ background: swatch[0] }}
                />
                <span
                  className="h-full w-1/2"
                  style={{ background: swatch[1] }}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">
                  {label}
                </span>
                <span className="mt-0.5 block font-mono text-[11px] text-stone-400">
                  {id}
                </span>
              </span>
              {active ? (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-paper">
                  <Check className="size-4" strokeWidth={2.5} aria-hidden />
                </span>
              ) : (
                <span
                  className="size-8 shrink-0 rounded-full border border-[var(--line)]"
                  aria-hidden
                />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
