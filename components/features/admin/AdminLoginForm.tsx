"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/app/actions/admin";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        await adminLogin({ username, password });
        router.replace("/admin");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "登录失败");
      }
    });
  };

  return (
    <div className="space-y-4">
      <header className="px-0.5">
        <h1 className="page-title text-[1.65rem]">管理后台</h1>
        <p className="mt-1 text-sm text-ink/70">账号密码登录，审核家庭创建</p>
      </header>

      <section className="paper-panel space-y-3 p-4">
        <label className="block text-xs font-bold text-[color:var(--muted)]">
          账号
        </label>
        <input
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-[var(--radius-card)] border border-[var(--line)] bg-background px-4 py-3 text-ink outline-none focus:border-accent"
          placeholder="用户名"
        />
        <label className="block text-xs font-bold text-[color:var(--muted)]">
          密码
        </label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-[var(--radius-card)] border border-[var(--line)] bg-background px-4 py-3 text-ink outline-none focus:border-accent"
          placeholder="密码"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        {error ? (
          <p className="text-sm font-semibold text-expense" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={pending || !username.trim() || !password}
          onClick={submit}
          className="btn-primary w-full disabled:opacity-55"
        >
          {pending ? "登录中…" : "登录"}
        </button>
      </section>
    </div>
  );
}
