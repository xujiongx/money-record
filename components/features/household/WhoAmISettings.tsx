"use client";

import { useEffect, useState } from "react";
import {
  LAST_RECORD_MEMBER_KEY,
  SELF_MEMBER_KEY,
  readPreferredMemberId,
} from "@/lib/ledger/preferences";
import type { MemberRow } from "@/lib/ledger/types";
import { MemberAvatar } from "@/components/common/MemberAvatar";

export function WhoAmISettings({ members }: { members: MemberRow[] }) {
  const [selfId, setSelfId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ids = members.map((m) => m.id);
    setSelfId(readPreferredMemberId(SELF_MEMBER_KEY, ids));
    setReady(true);
  }, [members]);

  const pick = (id: string) => {
    setSelfId(id);
    try {
      localStorage.setItem(SELF_MEMBER_KEY, id);
      // 尚未有上次记账人时，一并写入，记一笔默认更顺
      if (!localStorage.getItem(LAST_RECORD_MEMBER_KEY)) {
        localStorage.setItem(LAST_RECORD_MEMBER_KEY, id);
      }
    } catch {
      /* private mode */
    }
  };

  if (members.length === 0) return null;

  return (
    <section className="paper-panel space-y-3 p-4">
      <div>
        <p className="text-sm font-extrabold text-ink">我是谁</p>
        <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
          选本机常用的自己。会影响记一笔的默认记录人，以及首页「对方刚记了」。
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {members.map((m) => {
          const active = ready && selfId === m.id;
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => pick(m.id)}
                className={`pressable flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition ${
                  active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-[var(--line)] bg-background text-ink hover:bg-accent-soft/40"
                }`}
                aria-pressed={active}
              >
                <MemberAvatar
                  name={m.name}
                  avatarUrl={m.avatar_url}
                  size="sm"
                />
                {m.name}
              </button>
            </li>
          );
        })}
      </ul>
      {ready && !selfId ? (
        <p className="text-[11px] text-[color:var(--muted)]">
          还没选：首页暂时不展示「对方刚记了」；记一笔会用上次选过的人。
        </p>
      ) : null}
    </section>
  );
}
