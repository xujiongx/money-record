"use client";

import { useMemo } from "react";
import {
  getNoteHistoryForCategory,
  loadNoteHistory,
  type NoteHistoryEntry,
} from "@/lib/ledger/note-history";

export function NoteHistoryTags({
  category,
  refreshToken,
  onSelect,
}: {
  category: string;
  /** 保存成功后递增，用于重新读取 localStorage */
  refreshToken?: number;
  onSelect: (note: string) => void;
}) {
  const items = useMemo(
    () => getNoteHistoryForCategory(category, loadNoteHistory()),
    // refreshToken 变化时重新读盘
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshToken 仅作刷新信号
    [category, refreshToken],
  );

  const { row1, row2 } = useMemo(() => {
    const row1: NoteHistoryEntry[] = [];
    const row2: NoteHistoryEntry[] = [];
    items.forEach((e, i) => (i % 2 === 0 ? row1 : row2).push(e));
    return { row1, row2 };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5" aria-label="备注历史">
      <NoteHistoryRow entries={row1} onSelect={onSelect} />
      <NoteHistoryRow entries={row2} onSelect={onSelect} />
    </div>
  );
}

function NoteHistoryRow({
  entries,
  onSelect,
}: {
  entries: NoteHistoryEntry[];
  onSelect: (note: string) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {entries.map((e) => (
        <button
          key={`${e.category}-${e.note}-${e.usedAt}`}
          type="button"
          onClick={() => onSelect(e.note)}
          className="shrink-0 max-w-48 truncate rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 transition active:scale-[0.98] hover:bg-orange-50 hover:text-orange-700"
          title={e.note}
        >
          {e.note}
        </button>
      ))}
    </div>
  );
}
