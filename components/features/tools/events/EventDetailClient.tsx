"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { BarChart3, Trash2 } from "lucide-react";
import {
  createMajorEventExpense,
  deleteMajorEvent,
  deleteMajorEventExpense,
} from "@/app/actions/major-events";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { SubpageHeader } from "@/components/common/SubpageHeader";
import { DEFAULT_MAJOR_EVENT_CATEGORY } from "@/lib/events/categories";
import {
  eventMemberBreakdown,
  summarizeEventExpenses,
} from "@/lib/events/aggregates";
import type {
  MajorEventCategoryRow,
  MajorEventExpenseRow,
  MajorEventRow,
} from "@/lib/events/types";
import { toDatetimeLocalValue } from "@/lib/ledger/datetime-local";
import { formatMoney } from "@/lib/ledger/format";
import type { MemberRow } from "@/lib/ledger/types";

export function EventDetailClient({
  event,
  expenses,
  members,
  categories,
}: {
  event: MajorEventRow;
  expenses: MajorEventExpenseRow[];
  members: MemberRow[];
  categories: MajorEventCategoryRow[];
}) {
  const router = useRouter();
  const categoryNames = useMemo(
    () => categories.map((c) => c.name),
    [categories],
  );
  const defaultCategory =
    categoryNames.find((n) => n === DEFAULT_MAJOR_EVENT_CATEGORY) ??
    categoryNames[0] ??
    DEFAULT_MAJOR_EVENT_CATEGORY;

  const summary = useMemo(() => summarizeEventExpenses(expenses), [expenses]);
  const byMember = useMemo(
    () => eventMemberBreakdown(expenses, members),
    [expenses, members],
  );

  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [category, setCategory] = useState(defaultCategory);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [occurredAt, setOccurredAt] = useState(() =>
    toDatetimeLocalValue(new Date().toISOString()),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setCategory((prev) => (categoryNames.includes(prev) ? prev : defaultCategory));
  }, [categoryNames, defaultCategory]);

  const submitExpense = () => {
    setError(null);
    const n = parseFloat(amount.replace(/,/g, ""));
    if (!memberId) {
      setError("请选择成员");
      return;
    }
    if (!Number.isFinite(n) || n <= 0) {
      setError("请输入有效金额");
      return;
    }
    if (!categoryNames.includes(category)) {
      setError("请选择有效分类");
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
        await createMajorEventExpense({
          eventId: event.id,
          memberId,
          category,
          amount: n,
          note: note.trim() || undefined,
          occurredAt: at.toISOString(),
        });
        setAmount("");
        setNote("");
        setOccurredAt(toDatetimeLocalValue(new Date().toISOString()));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存失败");
      }
    });
  };

  const onDeleteExpense = (expenseId: string) => {
    if (!window.confirm("确定删除这笔支出？")) return;
    setDeletingId(expenseId);
    startTransition(async () => {
      try {
        await deleteMajorEventExpense(expenseId, event.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "删除失败");
      } finally {
        setDeletingId(null);
      }
    });
  };

  const onDeleteEvent = () => {
    if (
      !window.confirm(
        "确定删除整个大事？其下所有支出也会一并删除，且无法恢复。",
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteMajorEvent(event.id);
        router.push("/tools/events");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "删除失败");
      }
    });
  };

  return (
    <div className="space-y-5">
      <SubpageHeader
        backHref="/tools/events"
        title={event.title}
        subtitle={event.note ?? "大事支出明细"}
        right={
          <Link
            href={`/tools/events/${event.id}/analysis`}
            aria-label="分析"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-orange-600 transition hover:bg-orange-50 active:scale-[0.97]"
          >
            <BarChart3 className="size-5" strokeWidth={2.25} aria-hidden />
          </Link>
        }
      />

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <p className="text-xs font-medium text-stone-500">项目总支出</p>
        <p className="mt-1 text-2xl font-bold text-rose-600">
          {formatMoney(summary.total)}
        </p>
        <p className="mt-1 text-xs text-stone-500">共 {summary.count} 笔</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {byMember.map((m) => (
            <div
              key={m.memberId}
              className="rounded-xl bg-stone-50 px-3 py-2 text-center"
            >
              <p className="text-[11px] text-stone-500">{m.name}</p>
              <p className="mt-0.5 text-sm font-semibold text-stone-800">
                {formatMoney(m.total)}
              </p>
              <p className="text-[10px] text-stone-400">{m.count} 笔</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <h2 className="text-sm font-semibold text-stone-800">记一笔支出</h2>

        <p className="mt-3 text-xs font-medium text-stone-500">成员</p>
        <div className="mt-2 flex gap-3">
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

        <label className="mt-4 block text-xs font-medium text-stone-500">
          金额（元）
        </label>
        <input
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-xl font-bold text-stone-800 outline-none ring-orange-200 focus:ring-2"
        />

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-stone-500">分类</span>
          <Link
            href="/tools/events/categories"
            className="text-xs font-medium text-orange-600 hover:text-orange-700"
          >
            管理分类
          </Link>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {categoryNames.length === 0 ? (
            <p className="text-sm text-stone-500">
              暂无分类，请先
              <Link
                href="/tools/events/categories"
                className="mx-1 font-medium text-orange-600"
              >
                添加分类
              </Link>
            </p>
          ) : (
            categoryNames.map((c) => (
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
            ))
          )}
        </div>

        <label className="mt-4 block text-xs font-medium text-stone-500">
          日期与时间
        </label>
        <div className="mt-1 grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)]">
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="box-border col-span-1 min-h-11 min-w-0 w-full max-w-full rounded-xl border border-stone-200 bg-white px-2 py-2.5 text-base leading-normal text-stone-800 outline-none ring-orange-200 focus:ring-2 sm:px-4"
          />
        </div>

        <label className="mt-4 block text-xs font-medium text-stone-500">
          备注（可选）
        </label>
        <input
          type="text"
          placeholder="写点什么…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 outline-none ring-orange-200 focus:ring-2"
        />

        {error ? (
          <p className="mt-3 text-sm text-rose-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={pending}
          onClick={submitExpense}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-pink-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-500/35 transition active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "保存中…" : "保存支出"}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="px-0.5 text-sm font-semibold text-stone-800">支出明细</h2>
        {expenses.length === 0 ? (
          <div className="rounded-2xl bg-white/95 p-5 text-center text-sm text-stone-500 ring-1 ring-orange-100/80">
            暂无支出，记一笔吧
          </div>
        ) : (
          <ul className="space-y-2">
            {expenses.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-2xl bg-white/95 px-3 py-3 shadow-sm ring-1 ring-orange-100/80"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-stone-800">
                      {e.category}
                    </span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                      {e.members?.name ?? "未知"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-stone-500">
                    {format(new Date(e.occurred_at), "M月d日 HH:mm", {
                      locale: zhCN,
                    })}
                    {e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-rose-600">
                  -{formatMoney(e.amount)}
                </p>
                <button
                  type="button"
                  aria-label="删除"
                  disabled={pending && deletingId === e.id}
                  onClick={() => onDeleteExpense(e.id)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        disabled={pending}
        onClick={onDeleteEvent}
        className="w-full rounded-2xl border border-rose-200 bg-white py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
      >
        删除此大事
      </button>
    </div>
  );
}
