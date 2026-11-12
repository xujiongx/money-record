"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { createTransaction } from "@/app/actions/ledger";
import {
  DEFAULT_LEDGER_CATEGORY,
  categoryNamesForType,
  type LedgerCategoryRow,
} from "@/lib/ledger/categories";
import { toDatetimeLocalValue } from "@/lib/ledger/datetime-local";
import type { LedgerType, MemberRow } from "@/lib/ledger/types";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { NoteHistoryTags } from "@/components/features/record/NoteHistoryTags";
import { pushNoteHistory } from "@/lib/ledger/note-history";

const LAST_RECORD_MEMBER_KEY = "money-record:last-record-member-id";
/** 默认露出的分类数；其余收进「更多」 */
const VISIBLE_CATEGORY_COUNT = 8;

export function RecordForm({
  members,
  categories: categoryRows,
}: {
  members: MemberRow[];
  categories: LedgerCategoryRow[];
}) {
  const router = useRouter();
  const [type, setType] = useState<LedgerType>("expense");
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const expenseNames = useMemo(
    () => categoryNamesForType(categoryRows, "expense"),
    [categoryRows],
  );
  const incomeNames = useMemo(
    () => categoryNamesForType(categoryRows, "income"),
    [categoryRows],
  );
  const [category, setCategory] = useState<string>(
    () => expenseNames[0] ?? DEFAULT_LEDGER_CATEGORY,
  );
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [occurredAt, setOccurredAt] = useState(() =>
    toDatetimeLocalValue(new Date().toISOString()),
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [timeCustomized, setTimeCustomized] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [noteHistoryRefresh, setNoteHistoryRefresh] = useState(0);
  const [pending, startTransition] = useTransition();

  const categories = type === "expense" ? expenseNames : incomeNames;

  const visibleCategories = useMemo(() => {
    if (categoriesExpanded || categories.length <= VISIBLE_CATEGORY_COUNT) {
      return categories;
    }
    const head = categories.slice(0, VISIBLE_CATEGORY_COUNT);
    if (category && !head.includes(category)) {
      return [category, ...head.filter((c) => c !== category)].slice(
        0,
        VISIBLE_CATEGORY_COUNT,
      );
    }
    return head;
  }, [categories, categoriesExpanded, category]);

  const hiddenCategoryCount = Math.max(
    0,
    categories.length - VISIBLE_CATEGORY_COUNT,
  );

  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory(categories[0] ?? DEFAULT_LEDGER_CATEGORY);
    }
  }, [categories, category]);

  useEffect(() => {
    if (members.length === 0) return;
    try {
      const stored = localStorage.getItem(LAST_RECORD_MEMBER_KEY);
      if (stored && members.some((m) => m.id === stored)) {
        setMemberId(stored);
      }
    } catch {
      // private mode or storage blocked
    }
  }, [members]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const onTypeChange = (next: LedgerType) => {
    setType(next);
    const list = next === "expense" ? expenseNames : incomeNames;
    setCategory(list[0] ?? DEFAULT_LEDGER_CATEGORY);
    setCategoriesExpanded(false);
  };

  const submit = () => {
    setError(null);
    const n = parseFloat(amount.replace(/,/g, ""));
    if (!memberId) {
      setError("请选择记录人");
      return;
    }
    if (!Number.isFinite(n) || n <= 0) {
      setError("请输入有效金额");
      return;
    }
    const at = timeCustomized ? new Date(occurredAt) : new Date();
    if (Number.isNaN(at.getTime())) {
      setError("日期时间无效");
      return;
    }
    startTransition(async () => {
      try {
        await createTransaction({
          memberId,
          type,
          category,
          amount: n,
          note: note.trim() || undefined,
          occurredAt: at.toISOString(),
        });
        try {
          localStorage.setItem(LAST_RECORD_MEMBER_KEY, memberId);
        } catch {
          // private mode or storage blocked
        }
        const trimmedNote = note.trim();
        if (trimmedNote) {
          pushNoteHistory(category, trimmedNote);
          setNoteHistoryRefresh((token) => token + 1);
        }
        setAmount("");
        setNote("");
        if (!timeCustomized) {
          setOccurredAt(toDatetimeLocalValue(new Date().toISOString()));
        }
        setToast("已记好，可以继续记");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存失败");
      }
    });
  };

  return (
    <>
      <div className="min-w-0 space-y-5">
        <header>
          <h1 className="page-title text-2xl">记一笔</h1>
        </header>

        <div className="paper-panel min-w-0 max-w-full p-4">
          <div className="flex rounded-lg border border-[var(--line)] bg-background p-1">
            <button
              type="button"
              onClick={() => onTypeChange("expense")}
              className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition ${
                type === "expense"
                  ? "bg-expense text-paper"
                  : "text-stone-500"
              }`}
            >
              支出
            </button>
            <button
              type="button"
              onClick={() => onTypeChange("income")}
              className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition ${
                type === "income"
                  ? "bg-income text-paper"
                  : "text-stone-500"
              }`}
            >
              收入
            </button>
          </div>

          <label className="mt-5 block text-xs font-medium text-stone-500">
            金额（元）
          </label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-paper px-4 py-3 text-2xl font-bold text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
            autoFocus
          />

          <label className="mt-4 block text-xs font-medium text-stone-500">
            分类
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {visibleCategories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`chip active:scale-[0.98] ${
                  category === c ? "chip-active" : ""
                }`}
              >
                {c}
              </button>
            ))}
            {!categoriesExpanded && hiddenCategoryCount > 0 ? (
              <button
                type="button"
                onClick={() => setCategoriesExpanded(true)}
                className="chip text-stone-500"
              >
                更多 · {hiddenCategoryCount}
              </button>
            ) : null}
            {categoriesExpanded && categories.length > VISIBLE_CATEGORY_COUNT ? (
              <button
                type="button"
                onClick={() => setCategoriesExpanded(false)}
                className="chip text-stone-500"
              >
                收起
              </button>
            ) : null}
          </div>

          <p className="mt-5 text-xs font-medium text-stone-500">记录人</p>
          <div className="mt-2 flex gap-2">
            {members.map((m) => {
              const active = memberId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMemberId(m.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 transition active:scale-[0.98] ${
                    active
                      ? "border-accent bg-accent-soft/60"
                      : "border-[var(--line)] bg-background"
                  }`}
                >
                  <MemberAvatar
                    name={m.name}
                    avatarUrl={m.avatar_url}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-ink">{m.name}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setDetailsOpen((o) => !o)}
            className="mt-5 flex w-full items-center justify-between rounded-xl border border-[var(--line)] bg-background px-3 py-2.5 text-left text-sm text-ink transition hover:bg-accent-soft/40 active:scale-[0.99]"
            aria-expanded={detailsOpen}
          >
            <span>
              <span className="font-medium">时间与备注</span>
              <span className="ml-2 text-xs text-stone-500">
                {timeCustomized ? "已改时间" : "默认现在"}
                {note.trim() ? " · 有备注" : ""}
              </span>
            </span>
            {detailsOpen ? (
              <ChevronUp className="size-4 text-stone-400" aria-hidden />
            ) : (
              <ChevronDown className="size-4 text-stone-400" aria-hidden />
            )}
          </button>

          {detailsOpen ? (
            <div className="mt-3 space-y-4 border-t border-[var(--line)] pt-4">
              <div>
                <label className="block text-xs font-medium text-stone-500">
                  日期与时间
                </label>
                <div className="mt-1 grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)]">
                  <input
                    type="datetime-local"
                    value={occurredAt}
                    onChange={(e) => {
                      setOccurredAt(e.target.value);
                      setTimeCustomized(true);
                    }}
                    className="box-border col-span-1 min-h-11 min-w-0 w-full max-w-full rounded-lg border border-[var(--line)] bg-paper px-2 py-2.5 text-base leading-normal text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 sm:px-4"
                  />
                </div>
                {timeCustomized ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOccurredAt(
                        toDatetimeLocalValue(new Date().toISOString()),
                      );
                      setTimeCustomized(false);
                    }}
                    className="mt-2 text-xs font-medium text-accent"
                  >
                    改回现在
                  </button>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-500">
                  备注（可选）
                </label>
                <input
                  type="text"
                  placeholder="写点什么…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--line)] bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
                />
                <NoteHistoryTags
                  category={category}
                  refreshToken={noteHistoryRefresh}
                  onSelect={setNote}
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm text-expense" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="btn-primary mt-6"
          >
            {pending ? "保存中…" : "保存"}
          </button>
        </div>
      </div>

      <RecordToast message={toast} />
    </>
  );
}

function RecordToast({ message }: { message: string | null }) {
  const root = typeof document !== "undefined" ? document.body : null;
  if (!message || !root) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-[100] flex justify-center px-4"
    >
      <div className="rounded-full border border-[var(--line)] bg-ink px-4 py-2.5 text-sm font-medium text-paper shadow-sm">
        {message}
      </div>
    </div>,
    root,
  );
}
