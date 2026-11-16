"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  approveHousehold,
  clearAdminSession,
  rejectHousehold,
  type AdminHouseholdListRow,
} from "@/app/actions/admin";
import { SubpageHeader } from "@/components/common/SubpageHeader";

function formatCreatedAt(iso: string) {
  return format(new Date(iso), "yyyy年M月d日 HH:mm", { locale: zhCN });
}

export function AdminModerationClient({
  username,
  initialPending,
  initialActive,
}: {
  username: string;
  initialPending: AdminHouseholdListRow[];
  initialActive: AdminHouseholdListRow[];
}) {
  const router = useRouter();
  const [pendingRows, setPendingRows] = useState(initialPending);
  const [activeRows, setActiveRows] = useState(initialActive);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const logout = () => {
    startTransition(async () => {
      await clearAdminSession();
      router.replace("/admin/login");
      router.refresh();
    });
  };

  const approve = (id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await approveHousehold(id);
        setPendingRows((prev) => {
          const row = prev.find((r) => r.id === id);
          if (row) {
            setActiveRows((active) => [row, ...active.filter((a) => a.id !== id)]);
          }
          return prev.filter((r) => r.id !== id);
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "通过失败");
      }
    });
  };

  const reject = (id: string) => {
    if (!window.confirm("拒绝将删除该家庭申请并释放编码，确定？")) return;
    setError(null);
    startTransition(async () => {
      try {
        await rejectHousehold(id);
        setPendingRows((prev) => prev.filter((r) => r.id !== id));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "拒绝失败");
      }
    });
  };

  return (
    <div className="space-y-4 pb-8">
      <SubpageHeader
        backHref="/members/settings"
        title="管理后台"
        historyBack
        right={
          <button
            type="button"
            onClick={logout}
            className="text-[11px] font-bold text-accent"
            disabled={busy}
          >
            退出
          </button>
        }
      />

      <p className="px-0.5 text-xs text-[color:var(--muted)]">
        已登录：<span className="font-semibold text-ink">{username}</span>
      </p>

      {error ? (
        <p className="text-sm font-semibold text-expense" role="alert">
          {error}
        </p>
      ) : null}

      <section className="paper-panel p-4">
        <h2 className="text-sm font-extrabold text-ink">待审核创建</h2>
        <p className="mt-1 text-[11px] text-[color:var(--muted)]">
          通过后可用编码加入；拒绝将删除申请并释放编码
        </p>

        {pendingRows.length === 0 ? (
          <p className="mt-4 text-sm text-ink/60">暂无待审家庭</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {pendingRows.map((row) => (
              <li
                key={row.id}
                className="rounded-2xl border border-[var(--line)] bg-background px-3 py-3"
              >
                <p className="font-extrabold text-ink">{row.name}</p>
                <p className="mt-0.5 font-mono text-sm tracking-wider text-ink/80">
                  {row.code}
                </p>
                <p className="mt-1 text-[11px] text-[color:var(--muted)]">
                  申请于 {formatCreatedAt(row.created_at)}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => approve(row.id)}
                    className="btn-primary flex-1 !py-2.5 text-sm disabled:opacity-55"
                  >
                    通过
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => reject(row.id)}
                    className="pressable flex-1 rounded-full border border-expense/30 py-2.5 text-sm font-bold text-expense hover:bg-expense/10 disabled:opacity-55"
                  >
                    拒绝
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="paper-panel p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-extrabold text-ink">已有家庭</h2>
          <span className="text-[11px] font-semibold text-[color:var(--muted)]">
            {activeRows.length} 个
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[color:var(--muted)]">
          已通过审核、可用编码加入的家庭
        </p>

        {activeRows.length === 0 ? (
          <p className="mt-4 text-sm text-ink/60">暂无已通过家庭</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {activeRows.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-ink">{row.name}</p>
                  <p className="mt-0.5 font-mono text-sm tracking-wider text-ink/80">
                    {row.code}
                  </p>
                </div>
                <p className="shrink-0 text-right text-[11px] text-[color:var(--muted)]">
                  {formatCreatedAt(row.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
