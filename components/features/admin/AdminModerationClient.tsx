"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  approveHousehold,
  clearAdminSession,
  rejectHousehold,
  type PendingHouseholdRow,
} from "@/app/actions/admin";
import { SubpageHeader } from "@/components/common/SubpageHeader";

export function AdminModerationClient({
  username,
  initialPending,
}: {
  username: string;
  initialPending: PendingHouseholdRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialPending);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        setRows((prev) => prev.filter((r) => r.id !== id));
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
        setRows((prev) => prev.filter((r) => r.id !== id));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "拒绝失败");
      }
    });
  };

  return (
    <div className="space-y-4">
      <SubpageHeader
        backHref="/members/settings"
        title="审核家庭"
        historyBack
        right={
          <button
            type="button"
            onClick={logout}
            className="text-[11px] font-bold text-accent"
            disabled={pending}
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

        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-ink/60">暂无待审家庭</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-2xl border border-[var(--line)] bg-background px-3 py-3"
              >
                <p className="font-extrabold text-ink">{row.name}</p>
                <p className="mt-0.5 font-mono text-sm tracking-wider text-ink/80">
                  {row.code}
                </p>
                <p className="mt-1 text-[11px] text-[color:var(--muted)]">
                  申请于{" "}
                  {format(new Date(row.created_at), "yyyy年M月d日 HH:mm", {
                    locale: zhCN,
                  })}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => approve(row.id)}
                    className="btn-primary flex-1 !py-2.5 text-sm disabled:opacity-55"
                  >
                    通过
                  </button>
                  <button
                    type="button"
                    disabled={pending}
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
    </div>
  );
}
