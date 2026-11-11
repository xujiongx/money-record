"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createTransaction } from "@/app/actions/ledger";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/ledger/categories";
import { toDatetimeLocalValue } from "@/lib/ledger/datetime-local";
import type { LedgerType, MemberRow } from "@/lib/ledger/types";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { NoteHistoryTags } from "@/components/features/record/NoteHistoryTags";
import { pushNoteHistory } from "@/lib/ledger/note-history";

const LAST_RECORD_MEMBER_KEY = "money-record:last-record-member-id";

export function RecordForm({ members }: { members: MemberRow[] }) {
  const router = useRouter();
  const [type, setType] = useState<LedgerType>("expense");
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [category, setCategory] = useState<string>(
    EXPENSE_CATEGORIES[0] ?? "其他",
  );
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [occurredAt, setOccurredAt] = useState(() =>
    toDatetimeLocalValue(new Date().toISOString()),
  );
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [noteHistoryRefresh, setNoteHistoryRefresh] = useState(0);
  const [pending, startTransition] = useTransition();

  const categories = useMemo(
    () =>
      type === "expense"
        ? [...EXPENSE_CATEGORIES]
        : [...INCOME_CATEGORIES],
    [type],
  );

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

  const onTypeChange = (next: LedgerType) => {
    setType(next);
    setCategory(
      next === "expense"
        ? EXPENSE_CATEGORIES[0]
        : INCOME_CATEGORIES[0],
    );
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
    if (!occurredAt.trim()) {
      setError("请选择日期时间");
      return;
    }
    const at = new Date(occurredAt);
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
          setNoteHistoryRefresh((n) => n + 1);
        }
        setAmount("");
        setNote("");
        setSuccessOpen(true);
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
        <p className="mt-1 text-sm text-stone-500">写进家里的账本</p>
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
        />

        <label className="mt-4 block text-xs font-medium text-stone-500">
          分类
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((c) => (
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
        </div>

        <label className="mt-4 block text-xs font-medium text-stone-500">
          日期与时间
        </label>
        <div className="mt-1 grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)]">
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="box-border col-span-1 min-h-11 min-w-0 w-full max-w-full rounded-lg border border-[var(--line)] bg-paper px-2 py-2.5 text-base leading-normal text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 sm:px-4"
          />
        </div>

        <p className="mt-5 text-xs font-medium text-stone-500">记录人</p>
        <div className="mt-2 flex gap-3">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMemberId(m.id)}
              className={`flex flex-1 flex-col items-center rounded-xl border py-3 transition active:scale-[0.98] ${
                memberId === m.id
                  ? "border-accent bg-accent-soft/60"
                  : "border-[var(--line)] bg-background"
              }`}
            >
              <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
              <span className="mt-2 text-sm font-medium text-ink">
                {m.name}
              </span>
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs font-medium text-stone-500">
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

        {error && (
          <p className="mt-3 text-sm text-expense" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="btn-primary mt-6"
        >
          {pending ? "保存中…" : "保存记录"}
        </button>
      </div>
    </div>
    <RecordSuccessDialog open={successOpen} onClose={() => setSuccessOpen(false)} />
    </>
  );
}

function RecordSuccessDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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

  const root = typeof document !== "undefined" ? document.body : null;
  if (!open || !root) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex w-full max-w-[100dvw] items-center justify-center overflow-x-hidden overscroll-none bg-stone-900/35 p-4 touch-none sm:touch-auto"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-success-title"
        className="paper-panel w-full max-w-sm min-w-0 touch-pan-y overflow-hidden p-6 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d1fae5] text-income"
            aria-hidden
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2
            id="record-success-title"
            className="page-title mt-4 text-lg"
          >
            记好了
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            已写入账本，可以继续记。
          </p>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary mt-6"
          >
            知道了
          </button>
        </div>
      </div>
    </div>,
    root,
  );
}
