"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createLedgerCategory,
  deleteLedgerCategory,
  updateLedgerCategory,
} from "@/app/actions/ledger";
import { SubpageHeader } from "@/components/common/SubpageHeader";
import {
  DEFAULT_LEDGER_CATEGORY,
  type LedgerCategoryRow,
} from "@/lib/ledger/categories";
import type { LedgerType } from "@/lib/ledger/types";

export function LedgerCategoriesClient({
  categories: initial,
}: {
  categories: LedgerCategoryRow[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [tab, setTab] = useState<LedgerType>("expense");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setCategories(initial);
  }, [initial]);

  const visible = useMemo(
    () => categories.filter((c) => c.type === tab),
    [categories, tab],
  );

  const onCreate = () => {
    setError(null);
    startTransition(async () => {
      try {
        await createLedgerCategory(tab, newName);
        setNewName("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "添加失败");
      }
    });
  };

  const startEdit = (row: LedgerCategoryRow) => {
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
        await updateLedgerCategory(editingId, editingName);
        cancelEdit();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存失败");
      }
    });
  };

  const onDelete = (row: LedgerCategoryRow) => {
    if (row.name === DEFAULT_LEDGER_CATEGORY) return;
    const msg = `确定删除「${row.name}」？已有流水会归入「${DEFAULT_LEDGER_CATEGORY}」。`;
    if (!window.confirm(msg)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteLedgerCategory(row.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "删除失败");
      }
    });
  };

  return (
    <div className="space-y-5">
      <SubpageHeader
        backHref="/members/settings"
        title="分类设置"
        subtitle="日常记账收支分类"
      />

      <div className="flex gap-2">
        {(
          [
            { id: "expense", label: "支出" },
            { id: "income", label: "收入" },
          ] as const
        ).map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                cancelEdit();
                setError(null);
              }}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "border-accent bg-accent text-paper"
                  : "border-[var(--line)] bg-paper text-ink hover:bg-accent-soft/40"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <section className="paper-panel p-4">
        <h2 className="text-sm font-semibold text-ink">新增分类</h2>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={tab === "expense" ? "例如：宠物、数码" : "例如：兼职、退款"}
            className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-paper px-4 py-2.5 text-sm text-ink outline-none ring-accent/25 focus:ring-2"
          />
          <button
            type="button"
            disabled={pending || !newName.trim()}
            onClick={onCreate}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-paper disabled:opacity-60"
          >
            <Plus className="size-4" aria-hidden />
            添加
          </button>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          「{DEFAULT_LEDGER_CATEGORY}」为默认项，不可删除；改名会同步已有流水。
        </p>
      </section>

      <section className="paper-panel p-4">
        <h2 className="text-sm font-semibold text-ink">
          已有{tab === "expense" ? "支出" : "收入"}分类
        </h2>
        <ul className="mt-3 space-y-2">
          {visible.length === 0 ? (
            <li className="py-6 text-center text-sm text-stone-500">
              暂无分类，请先添加
            </li>
          ) : null}
          {visible.map((row) => {
            const isDefault = row.name === DEFAULT_LEDGER_CATEGORY;
            const isEditing = editingId === row.id;
            return (
              <li
                key={row.id}
                className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-paper/60 px-3 py-2.5"
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-paper px-3 py-1.5 text-sm outline-none ring-accent/25 focus:ring-2"
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={pending}
                      onClick={onSaveEdit}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-paper disabled:opacity-60"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      aria-label="取消"
                      onClick={cancelEdit}
                      className="flex size-8 items-center justify-center rounded-lg text-stone-500 hover:bg-accent-soft"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 text-sm font-medium text-ink">
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
                      className="flex size-8 items-center justify-center rounded-lg text-stone-500 transition hover:bg-accent-soft hover:text-accent"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </button>
                    {!isDefault ? (
                      <button
                        type="button"
                        aria-label={`删除 ${row.name}`}
                        disabled={pending}
                        onClick={() => onDelete(row)}
                        className="flex size-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-[#ffe4e6] hover:text-expense disabled:opacity-50"
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
        <p className="text-sm text-expense" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
