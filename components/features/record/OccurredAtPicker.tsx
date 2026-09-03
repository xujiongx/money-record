"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import Picker, { type PickerValue } from "react-mobile-picker";
import {
  applyQuickDayPreset,
  matchQuickDayPreset,
  parseDatetimeLocal,
  toDatetimeLocalValueFromDate,
  type QuickDayPreset,
} from "@/lib/ledger/datetime-local";

const QUICK_PRESETS: { id: QuickDayPreset; label: string }[] = [
  { id: "today", label: "今天" },
  { id: "yesterday", label: "昨天" },
  { id: "dayBeforeYesterday", label: "前天" },
];

type WheelValue = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month1to12: number) {
  return new Date(year, month1to12, 0).getDate();
}

function dateToWheel(d: Date): WheelValue {
  return {
    year: String(d.getFullYear()),
    month: pad2(d.getMonth() + 1),
    day: pad2(d.getDate()),
    hour: pad2(d.getHours()),
    minute: pad2(d.getMinutes()),
  };
}

function wheelToDate(w: WheelValue): Date {
  const year = Number(w.year);
  const month = Number(w.month);
  const maxDay = daysInMonth(year, month);
  const day = Math.min(Number(w.day) || 1, maxDay);
  return new Date(
    year,
    month - 1,
    day,
    Number(w.hour) || 0,
    Number(w.minute) || 0,
    0,
    0,
  );
}

function clampWheel(w: WheelValue): WheelValue {
  const year = Number(w.year);
  const month = Number(w.month);
  const maxDay = daysInMonth(year, month);
  const day = Math.min(Number(w.day) || 1, maxDay);
  return { ...w, day: pad2(day) };
}

const YEAR_OPTIONS = (() => {
  const y = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, i) => String(y - 10 + i));
})();
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => pad2(i + 1));
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => pad2(i));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => pad2(i));

export function OccurredAtPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<WheelValue>(() =>
    dateToWheel(parseDatetimeLocal(value) ?? new Date()),
  );
  const selected = parseDatetimeLocal(value);
  const activeQuick = matchQuickDayPreset(value);
  const summary = selected
    ? format(selected, "yyyy年M月d日 HH:mm")
    : "选择日期与时间";

  const dayOptions = useMemo(() => {
    const max = daysInMonth(Number(draft.year), Number(draft.month));
    return Array.from({ length: max }, (_, i) => pad2(i + 1));
  }, [draft.year, draft.month]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOx = html.style.overflowX;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflowX = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflowX = prevHtmlOx;
      body.style.overflow = prevBodyOverflow;
    };
  }, [open]);

  const openSheet = () => {
    setDraft(dateToWheel(parseDatetimeLocal(value) ?? new Date()));
    setOpen(true);
  };

  const confirm = () => {
    onChange(toDatetimeLocalValueFromDate(wheelToDate(clampWheel(draft))));
    setOpen(false);
  };

  const onWheelChange = (next: PickerValue) => {
    setDraft(clampWheel(next as WheelValue));
  };

  const root = typeof document !== "undefined" ? document.body : null;
  const draftDate = wheelToDate(draft);

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap gap-2">
        {QUICK_PRESETS.map((p) => {
          const active = activeQuick === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(applyQuickDayPreset(value, p.id))}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition active:scale-[0.98] ${
                active
                  ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={openSheet}
        className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left text-base text-stone-800 outline-none ring-orange-200 transition hover:border-orange-200 focus:ring-2"
      >
        <CalendarDays
          className="size-4 shrink-0 text-orange-500"
          strokeWidth={2}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate font-medium">{summary}</span>
      </button>

      {open && root
        ? createPortal(
            <div
              className="fixed inset-0 z-[110] flex w-full max-w-[100dvw] items-end justify-center overflow-x-hidden overscroll-none bg-black/40 p-0 touch-none sm:items-center sm:p-4 sm:touch-auto"
              role="presentation"
              onClick={() => setOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="occurred-at-title"
                className="w-full max-w-md min-w-0 overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-stone-200 sm:rounded-3xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
                  <div className="min-w-0">
                    <h2
                      id="occurred-at-title"
                      className="text-sm font-semibold text-stone-800"
                    >
                      选择日期与时间
                    </h2>
                    <p className="mt-0.5 truncate text-xs text-stone-500">
                      {format(draftDate, "yyyy年M月d日 HH:mm")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={confirm}
                    className="shrink-0 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
                  >
                    完成
                  </button>
                </div>

                <div className="px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
                  <div className="grid grid-cols-5 px-1 pb-1 text-center text-[11px] font-medium text-stone-400">
                    <span>年</span>
                    <span>月</span>
                    <span>日</span>
                    <span>时</span>
                    <span>分</span>
                  </div>
                  <Picker
                    value={draft}
                    onChange={onWheelChange}
                    height={180}
                    itemHeight={36}
                    wheelMode="natural"
                  >
                    <Picker.Column name="year">
                      {YEAR_OPTIONS.map((y) => (
                        <Picker.Item key={y} value={y}>
                          {({ selected: sel }) => (
                            <span
                              className={`text-sm ${
                                sel
                                  ? "font-semibold text-orange-600"
                                  : "text-stone-500"
                              }`}
                            >
                              {y}
                            </span>
                          )}
                        </Picker.Item>
                      ))}
                    </Picker.Column>
                    <Picker.Column name="month">
                      {MONTH_OPTIONS.map((m) => (
                        <Picker.Item key={m} value={m}>
                          {({ selected: sel }) => (
                            <span
                              className={`text-sm ${
                                sel
                                  ? "font-semibold text-orange-600"
                                  : "text-stone-500"
                              }`}
                            >
                              {Number(m)}
                            </span>
                          )}
                        </Picker.Item>
                      ))}
                    </Picker.Column>
                    <Picker.Column name="day">
                      {dayOptions.map((d) => (
                        <Picker.Item key={d} value={d}>
                          {({ selected: sel }) => (
                            <span
                              className={`text-sm ${
                                sel
                                  ? "font-semibold text-orange-600"
                                  : "text-stone-500"
                              }`}
                            >
                              {Number(d)}
                            </span>
                          )}
                        </Picker.Item>
                      ))}
                    </Picker.Column>
                    <Picker.Column name="hour">
                      {HOUR_OPTIONS.map((h) => (
                        <Picker.Item key={h} value={h}>
                          {({ selected: sel }) => (
                            <span
                              className={`text-sm ${
                                sel
                                  ? "font-semibold text-orange-600"
                                  : "text-stone-500"
                              }`}
                            >
                              {h}
                            </span>
                          )}
                        </Picker.Item>
                      ))}
                    </Picker.Column>
                    <Picker.Column name="minute">
                      {MINUTE_OPTIONS.map((m) => (
                        <Picker.Item key={m} value={m}>
                          {({ selected: sel }) => (
                            <span
                              className={`text-sm ${
                                sel
                                  ? "font-semibold text-orange-600"
                                  : "text-stone-500"
                              }`}
                            >
                              {m}
                            </span>
                          )}
                        </Picker.Item>
                      ))}
                    </Picker.Column>
                  </Picker>
                </div>
              </div>
            </div>,
            root,
          )
        : null}
    </div>
  );
}
