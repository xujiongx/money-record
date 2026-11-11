"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronRight, Plus, Tags } from "lucide-react";
import { createMajorEvent } from "@/app/actions/major-events";
import { SubpageHeader } from "@/components/common/SubpageHeader";
import { formatMoney } from "@/lib/ledger/format";
import type { MajorEventListItem } from "@/lib/events/types";

export function EventsListClient({ events }: { events: MajorEventListItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    if (!title.trim()) {
      setError("请输入事项名称");
      return;
    }
    startTransition(async () => {
      try {
        const id = await createMajorEvent({
          title,
          note: note.trim() || undefined,
        });
        setTitle("");
        setNote("");
        setOpen(false);
        router.push(`/tools/events/${id}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "创建失败");
      }
    });
  };

  return (
    <div className="space-y-5">
      <SubpageHeader
        backHref="/tools"
        title="大事记账"
        subtitle="大项目支出统计"
        right={
          <button
            type="button"
            aria-label="新建事项"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-accent transition hover:bg-accent-soft active:scale-[0.97]"
          >
            <Plus className="size-6" strokeWidth={2.25} aria-hidden />
          </button>
        }
      />

      <Link
        href="/tools/events/categories"
        className="flex items-center gap-2 paper-panel px-4 py-3 text-sm font-medium text-ink transition hover:bg-accent-soft/60 active:scale-[0.99]"
      >
        <Tags className="size-4 text-accent" aria-hidden />
        管理支出分类
        <ChevronRight
          className="ml-auto size-4 text-stone-300"
          strokeWidth={2.25}
          aria-hidden
        />
      </Link>

      {open ? (
        <section className="paper-panel p-4">
          <h2 className="text-sm font-semibold text-stone-800">新建大事</h2>
          <label className="mt-3 block text-xs font-medium text-stone-500">
            事项名称
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：新房装修、婚礼筹备"
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 outline-none ring-accent/25 focus:ring-2"
          />
          <label className="mt-3 block text-xs font-medium text-stone-500">
            备注（可选）
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="简要说明"
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 outline-none ring-accent/25 focus:ring-2"
          />
          {error ? (
            <p className="mt-2 text-sm text-expense" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-600"
            >
              取消
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={submit}
              className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-paper disabled:opacity-60"
            >
              {pending ? "创建中…" : "创建"}
            </button>
          </div>
        </section>
      ) : null}

      {events.length === 0 ? (
        <section className="paper-panel p-6 text-center border border-[var(--line)]">
          <p className="text-sm font-medium text-stone-700">还没有大事</p>
          <p className="mt-1 text-xs text-stone-500">
            点击右上角 + 创建第一个大项目
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 inline-flex items-center gap-1 rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent"
          >
            <Plus className="size-4" aria-hidden />
            新建事项
          </button>
        </section>
      ) : (
        <ul className="space-y-3">
          {events.map((ev) => (
            <li key={ev.id}>
              <Link
                href={`/tools/events/${ev.id}`}
                className="flex items-center gap-3 paper-panel p-4 transition hover:bg-accent-soft/60 active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-stone-800">
                      {ev.title}
                    </p>
                    {ev.status === "archived" ? (
                      <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                        已归档
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {ev.expense_count} 笔支出
                    <span className="text-stone-300"> · </span>
                    {format(new Date(ev.created_at), "yyyy年M月d日", {
                      locale: zhCN,
                    })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-expense">
                    {formatMoney(ev.expense_total)}
                  </p>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-stone-300"
                  strokeWidth={2.25}
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
