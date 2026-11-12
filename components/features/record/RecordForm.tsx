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
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { MascotIllustration } from "@/components/common/MascotIllustration";
import { NoteHistoryTags } from "@/components/features/record/NoteHistoryTags";
import { pushNoteHistory } from "@/lib/ledger/note-history";
import { LAST_RECORD_MEMBER_KEY } from "@/lib/ledger/preferences";

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
  const [memberOpen, setMemberOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [timeCustomized, setTimeCustomized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [noteHistoryRefresh, setNoteHistoryRefresh] = useState(0);
  const [pending, startTransition] = useTransition();

  const categories = type === "expense" ? expenseNames : incomeNames;
  const selectedMember = members.find((m) => m.id === memberId);

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
        setToast("记好啦，生活又清晰一点");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存失败");
      }
    });
  };

  return (
    <>
      <div className="min-w-0 space-y-4">
        <header className="px-0.5">
          <h1 className="page-title text-[1.65rem]">记一笔</h1>
        </header>

        <div className="paper-panel min-w-0 max-w-full p-4">
          {/* 金额置顶 */}
          <label className="block text-xs font-bold text-[color:var(--muted)]">
            金额
          </label>
          <div className="mt-1.5 flex items-baseline gap-1 rounded-[1.25rem] border border-[var(--line)] bg-background px-4 py-4 focus-within:border-accent focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_22%,transparent)]">
            <span className="text-3xl font-extrabold text-[color:var(--muted)]">
              ¥
            </span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="kpi-number min-w-0 flex-1 bg-transparent text-[2.35rem] text-ink outline-none placeholder:text-ink/20"
              autoFocus
            />
          </div>

          {/* 支出/收入 + 分类靠近 */}
          <div className="mt-3 space-y-2.5">
            <div className="segmented">
              <button
                type="button"
                onClick={() => onTypeChange("expense")}
                className={`segmented-item ${
                  type === "expense" ? "segmented-item-active !bg-expense" : ""
                }`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => onTypeChange("income")}
                className={`segmented-item ${
                  type === "income" ? "segmented-item-active !bg-income" : ""
                }`}
              >
                收入
              </button>
            </div>

            <div className="-mx-1 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-2">
                {categories.map((c) => {
                  const active = category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-1.5 py-2.5 transition active:scale-[0.97] ${
                        active
                          ? "border-accent bg-accent-soft shadow-[var(--shadow-soft)]"
                          : "border-transparent bg-background"
                      }`}
                    >
                      <CategoryIcon name={c} size="md" />
                      <span
                        className={`max-w-full truncate text-[11px] font-bold ${
                          active ? "text-accent" : "text-ink"
                        }`}
                      >
                        {c}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 备注外置 */}
          <label className="mt-4 block text-xs font-bold text-[color:var(--muted)]">
            备注（可选）
          </label>
          <input
            type="text"
            placeholder="写点什么…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="field mt-1.5 text-sm"
          />
          <NoteHistoryTags
            category={category}
            refreshToken={noteHistoryRefresh}
            onSelect={setNote}
          />

          {/* 记录人收起 */}
          <button
            type="button"
            onClick={() => setMemberOpen((o) => !o)}
            className="pressable mt-4 flex w-full items-center justify-between rounded-2xl border border-[var(--line)] bg-background px-3.5 py-3 text-left text-sm text-ink hover:bg-accent-soft/40"
            aria-expanded={memberOpen}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="font-bold">记录人</span>
              {selectedMember ? (
                <span className="flex min-w-0 items-center gap-1.5 text-xs text-[color:var(--muted)]">
                  <MemberAvatar
                    name={selectedMember.name}
                    avatarUrl={selectedMember.avatar_url}
                    size="sm"
                  />
                  <span className="truncate font-semibold text-ink">
                    {selectedMember.name}
                  </span>
                </span>
              ) : (
                <span className="text-xs text-[color:var(--muted)]">未选择</span>
              )}
            </span>
            {memberOpen ? (
              <ChevronUp className="size-4 shrink-0 text-stone-400" aria-hidden />
            ) : (
              <ChevronDown
                className="size-4 shrink-0 text-stone-400"
                aria-hidden
              />
            )}
          </button>
          {memberOpen ? (
            <div className="mt-2 flex gap-2">
              {members.map((m) => {
                const active = memberId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMemberId(m.id);
                      setMemberOpen(false);
                    }}
                    className={`pressable flex flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-3 ${
                      active
                        ? "border-accent bg-accent-soft shadow-[var(--shadow-soft)]"
                        : "border-[var(--line)] bg-background"
                    }`}
                  >
                    <MemberAvatar
                      name={m.name}
                      avatarUrl={m.avatar_url}
                      size="sm"
                    />
                    <span className="text-sm font-bold text-ink">{m.name}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* 时间收起 */}
          <button
            type="button"
            onClick={() => setTimeOpen((o) => !o)}
            className="pressable mt-2 flex w-full items-center justify-between rounded-2xl border border-[var(--line)] bg-background px-3.5 py-3 text-left text-sm text-ink hover:bg-accent-soft/40"
            aria-expanded={timeOpen}
          >
            <span>
              <span className="font-bold">时间</span>
              <span className="ml-2 text-xs text-[color:var(--muted)]">
                {timeCustomized ? "已改时间" : "默认现在"}
              </span>
            </span>
            {timeOpen ? (
              <ChevronUp className="size-4 text-stone-400" aria-hidden />
            ) : (
              <ChevronDown className="size-4 text-stone-400" aria-hidden />
            )}
          </button>
          {timeOpen ? (
            <div className="mt-2 space-y-2">
              <div className="grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)]">
                <input
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => {
                    setOccurredAt(e.target.value);
                    setTimeCustomized(true);
                  }}
                  className="field box-border col-span-1 min-h-11 min-w-0 w-full max-w-full px-2 text-base sm:px-4"
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
                  className="text-xs font-bold text-accent"
                >
                  改回现在
                </button>
              ) : null}
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
            className="btn-primary mt-5"
          >
            {pending ? "保存中…" : "保存这一笔"}
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
      <div className="flex items-center gap-2.5 rounded-[1.25rem] border border-[var(--line)] bg-paper px-3 py-2 pr-4 text-sm font-bold text-ink shadow-[var(--shadow-soft)]">
        <MascotIllustration
          name="successSaved"
          size="sm"
          className="!h-14 !w-14 shrink-0"
          alt=""
        />
        <span>{message}</span>
      </div>
    </div>,
    root,
  );
}
