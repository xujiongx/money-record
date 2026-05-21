"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { updateTransaction } from "@/app/actions/ledger";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/ledger/categories";
import type { LedgerType, MemberRow, TransactionRow } from "@/lib/ledger/types";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { toDatetimeLocalValue } from "@/lib/ledger/datetime-local";
import { pushNoteHistory } from "@/lib/ledger/note-history";
import { NoteHistoryTags } from "@/components/features/record/NoteHistoryTags";

export function EditTransactionModal({
  transaction,
  members,
  onClose,
  onSaved,
}: {
  transaction: TransactionRow;
  members: MemberRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<LedgerType>(() => transaction.type);
  const [memberId, setMemberId] = useState(() => transaction.member_id);
  const [category, setCategory] = useState(() => transaction.category);
  const [amount, setAmount] = useState(() => String(transaction.amount));
  const [note, setNote] = useState(() => transaction.note ?? "");
  const [occurredAt, setOccurredAt] = useState(() =>
    toDatetimeLocalValue(transaction.occurred_at),
  );
  const [error, setError] = useState<string | null>(null);
  const [noteHistoryRefresh, setNoteHistoryRefresh] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /** 锁住底层滚动与横向溢出，避免弹窗打开时背后页面被带动（含 iOS 横向橡皮筋） */
  useEffect(() => {
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
  }, []);

  const categories = useMemo((): string[] => {
    const base = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const list: string[] = [...base];
    if (!list.includes(category)) {
      list.unshift(category);
    }
    return list;
  }, [type, category]);

  const onTypeChange = (next: LedgerType) => {
    setType(next);
    const list: string[] = [
      ...(next === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES),
    ];
    setCategory(list.includes(category) ? category : list[0]!);
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
        await updateTransaction(transaction.id, {
          memberId,
          type,
          category,
          amount: n,
          note: note.trim() || undefined,
          occurredAt: at.toISOString(),
        });
        const trimmedNote = note.trim();
        if (trimmedNote) {
          pushNoteHistory(category, trimmedNote);
          setNoteHistoryRefresh((n) => n + 1);
        }
        onSaved();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存失败");
      }
    });
  };

  /** 挂到 body，避免落在 main(z-10) 内导致整层低于底部 nav(z-20) */
  const root =
    typeof document !== "undefined" ? document.body : null;
  if (!root) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex w-full max-w-[100dvw] items-end justify-center overflow-x-hidden overscroll-none bg-black/40 p-0 touch-none sm:items-center sm:p-4 sm:touch-auto"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-tx-title"
        className="max-h-[min(92vh,640px)] w-full max-w-md min-w-0 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-y-contain rounded-t-3xl bg-white shadow-2xl ring-1 ring-stone-200 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white px-4 py-3">
          <h2 id="edit-tx-title" className="text-base font-semibold text-stone-800">
            编辑记录
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
            aria-label="关闭"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-w-0 space-y-4 p-4 pb-6">
          <div className="flex rounded-2xl bg-stone-100/80 p-1">
            <button
              type="button"
              onClick={() => onTypeChange("expense")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                type === "expense"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-stone-500"
              }`}
            >
              支出
            </button>
            <button
              type="button"
              onClick={() => onTypeChange("income")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                type === "income"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-stone-500"
              }`}
            >
              收入
            </button>
          </div>

          <label className="block text-xs font-medium text-stone-500">
            金额（元）
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-xl font-bold text-stone-800 outline-none ring-orange-200 focus:ring-2"
          />

          <label className="block text-xs font-medium text-stone-500">
            分类
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition active:scale-[0.98] ${
                  category === c
                    ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <label className="block text-xs font-medium text-stone-500">
            日期与时间
          </label>
          <div className="grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)]">
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="box-border col-span-1 min-h-11 min-w-0 w-full max-w-full rounded-xl border border-stone-200 bg-white px-2 py-2.5 text-base leading-normal text-stone-800 outline-none ring-orange-200 focus:ring-2 sm:px-4"
            />
          </div>

          <p className="text-xs font-medium text-stone-500">记录人</p>
          <div className="flex gap-3">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMemberId(m.id)}
                className={`flex flex-1 flex-col items-center rounded-2xl border-2 py-3 transition active:scale-[0.98] ${
                  memberId === m.id
                    ? "border-orange-400 bg-orange-50/80"
                    : "border-transparent bg-stone-50"
                }`}
              >
                <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
                <span className="mt-2 text-sm font-medium text-stone-800">
                  {m.name}
                </span>
              </button>
            ))}
          </div>

          <label className="block text-xs font-medium text-stone-500">
            备注（可选）
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 outline-none ring-orange-200 focus:ring-2"
          />
          <NoteHistoryTags
            category={category}
            refreshToken={noteHistoryRefresh}
            onSelect={setNote}
          />

          {error && (
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-stone-200 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
            >
              取消
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={submit}
              className="flex-1 rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-pink-500 py-3 text-sm font-semibold text-white shadow-md transition active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "保存中…" : "保存修改"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    root,
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
