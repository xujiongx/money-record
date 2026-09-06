"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createMajorEventCategory,
  deleteMajorEventCategory,
  updateMajorEventCategory,
} from "@/app/actions/major-events";
import { SubpageHeader } from "@/components/common/SubpageHeader";
import {
  DEFAULT_MAJOR_EVENT_CATEGORY,
} from "@/lib/events/categories";
import type { MajorEventCategoryRow } from "@/lib/events/types";

export function EventCategoriesClient({
  categories: initial,
}: {
  categories: MajorEventCategoryRow[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setCategories(initial);
  }, [initial]);

  const onCreate = () => {
    setError(null);
    startTransition(async () => {
      try {
        await createMajorEventCategory(newName);
        setNewName("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "添加失败");
      }
    });
  };

  const startEdit = (row: MajorEventCategoryRow) => {
    setEditingId(row.id);
    setEditingName(row.name);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const onSaveEdit = () => {
    if (!editingId) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateMajorEventCategory(editingId, editingName);
        cancelEdit();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存失败");
      }
    });
  };

  const onDelete = (row: MajorEventCategoryRow) => {
    if (row.name === DEFAULT_MAJOR_EVENT_CATEGORY) return;
    const msg =
      "确定删除该分类？已有支出会归入「其他」。";
    if (!window.confirm(msg)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteMajorEventCategory(row.id);
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
        title="支出分类"
        subtitle="大事记账专用"
      />

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <h2 className="text-sm font-semibold text-stone-800">新增分类</h2>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="例如：装修、家具"
            className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 outline-none ring-orange-200 focus:ring-2"
          />
          <button
            type="button"
            disabled={pending || !newName.trim()}
            onClick={onCreate}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
          >
            <Plus className="size-4" aria-hidden />
            添加
          </button>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          默认仅有「{DEFAULT_MAJOR_EVENT_CATEGORY}」，可按项目自行扩展。
        </p>
      </section>

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <h2 className="text-sm font-semibold text-stone-800">已有分类</h2>
        <ul className="mt-3 space-y-2">
          {categories.map((row) => {
            const isDefault = row.name === DEFAULT_MAJOR_EVENT_CATEGORY;
            const isEditing = editingId === row.id;
            return (
              <li
                key={row.id}
                className="flex items-center gap-2 rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2.5"
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm outline-none ring-orange-200 focus:ring-2"
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={pending}
                      onClick={onSaveEdit}
                      className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      aria-label="取消"
                      onClick={cancelEdit}
                      className="flex size-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200/60"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 text-sm font-medium text-stone-800">
                      {row.name}
                      {isDefault ? (
                        <span className="ml-2 text-[10px] font-normal text-stone-400">
                          默认
                        </span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      aria-label={`编辑 ${row.name}`}
                      onClick={() => startEdit(row)}
                      className="flex size-8 items-center justify-center rounded-lg text-stone-500 transition hover:bg-white hover:text-orange-600"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </button>
                    {!isDefault ? (
                      <button
                        type="button"
                        aria-label={`删除 ${row.name}`}
                        disabled={pending}
                        onClick={() => onDelete(row)}
                        className="flex size-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    ) : (
                      <span className="size-8 shrink-0" aria-hidden />
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
