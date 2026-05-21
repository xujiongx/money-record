/** 备注历史 localStorage 键；与分类关联，最多保留 {@link NOTE_HISTORY_MAX} 条 */
export const NOTE_HISTORY_STORAGE_KEY = "money-record:note-history";

export const NOTE_HISTORY_MAX = 150;

export type NoteHistoryEntry = {
  category: string;
  note: string;
  usedAt: number;
};

export function loadNoteHistory(): NoteHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTE_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is NoteHistoryEntry =>
          e != null &&
          typeof e === "object" &&
          typeof (e as NoteHistoryEntry).category === "string" &&
          typeof (e as NoteHistoryEntry).note === "string" &&
          typeof (e as NoteHistoryEntry).usedAt === "number",
      )
      .map((e) => ({
        category: e.category.trim(),
        note: e.note.trim(),
        usedAt: e.usedAt,
      }))
      .filter((e) => e.category && e.note)
      .slice(0, NOTE_HISTORY_MAX);
  } catch {
    return [];
  }
}

function saveNoteHistory(entries: NoteHistoryEntry[]): void {
  try {
    localStorage.setItem(
      NOTE_HISTORY_STORAGE_KEY,
      JSON.stringify(entries.slice(0, NOTE_HISTORY_MAX)),
    );
  } catch {
    // private mode or storage blocked
  }
}

/** 成功保存带备注的流水后调用：同分类同文案去重并置顶，总量不超过上限 */
export function pushNoteHistory(category: string, note: string): void {
  const trimmed = note.trim();
  const cat = category.trim();
  if (!trimmed || !cat) return;

  const all = loadNoteHistory().filter(
    (e) => !(e.category === cat && e.note === trimmed),
  );
  all.unshift({ category: cat, note: trimmed, usedAt: Date.now() });
  saveNoteHistory(all);
}

export function getNoteHistoryForCategory(
  category: string,
  all = loadNoteHistory(),
): NoteHistoryEntry[] {
  const cat = category.trim();
  if (!cat) return [];
  return all.filter((e) => e.category === cat);
}
