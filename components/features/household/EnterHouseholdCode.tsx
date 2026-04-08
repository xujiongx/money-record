"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  createHouseholdAndLogin,
  setHouseholdSession,
} from "@/app/actions/household";
import {
  HOUSEHOLD_CODE_STORAGE_KEY,
  normalizeHouseholdCode,
} from "@/lib/household";

type Mode = "login" | "create";

export function EnterHouseholdCode() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [householdName, setHouseholdName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const codeString = digits.join("");

  useEffect(() => {
    const stored = localStorage.getItem(HOUSEHOLD_CODE_STORAGE_KEY);
    const normalized = normalizeHouseholdCode(stored ?? "");
    if (!normalized) return;
    startTransition(async () => {
      try {
        await setHouseholdSession(normalized);
        router.replace("/");
        router.refresh();
      } catch {
        localStorage.removeItem(HOUSEHOLD_CODE_STORAGE_KEY);
      }
    });
  }, [router]);

  const resetDigits = () => setDigits(["", "", "", "", "", ""]);

  const onModeChange = (next: Mode) => {
    setMode(next);
    setError(null);
    resetDigits();
    setHouseholdName("");
  };

  const onDigitChange = (index: number, value: string) => {
    const d = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = d;
    setDigits(next);
    setError(null);
    if (d && index < 5) {
      const el = document.getElementById(`household-digit-${index + 1}`);
      (el as HTMLInputElement | null)?.focus();
    }
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const el = document.getElementById(`household-digit-${index - 1}`);
      (el as HTMLInputElement | null)?.focus();
    }
  };

  const submitLogin = () => {
    setError(null);
    const code = normalizeHouseholdCode(codeString);
    if (!code) {
      setError("请输入完整的 6 位数字");
      return;
    }
    startTransition(async () => {
      try {
        await setHouseholdSession(code);
        localStorage.setItem(HOUSEHOLD_CODE_STORAGE_KEY, code);
        router.replace("/");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "验证失败");
      }
    });
  };

  const submitCreate = () => {
    setError(null);
    const code = normalizeHouseholdCode(codeString);
    if (!code) {
      setError("请输入完整的 6 位数字家庭编码");
      return;
    }
    if (!householdName.trim()) {
      setError("请输入家庭名称");
      return;
    }
    startTransition(async () => {
      try {
        await createHouseholdAndLogin({
          name: householdName,
          codeRaw: codeString,
        });
        localStorage.setItem(HOUSEHOLD_CODE_STORAGE_KEY, code);
        router.replace("/");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "创建失败");
      }
    });
  };

  const DigitRow = (
    <div className="mt-4 flex justify-center gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`household-digit-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoComplete="off"
          autoFocus={mode === "login" && i === 0}
          value={d}
          onChange={(e) => onDigitChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          className="h-12 w-10 rounded-xl border border-stone-200 text-center text-xl font-bold text-stone-800 outline-none ring-orange-300 focus:border-orange-400 focus:ring-2"
          aria-label={`第 ${i + 1} 位`}
        />
      ))}
    </div>
  );

  return (
    <div className="flex min-h-[70vh] flex-col justify-center space-y-6 px-1">
      <header className="text-center">
        <p className="text-sm font-medium text-white/90">欢迎使用</p>
        <h1 className="mt-2 text-2xl font-bold text-white drop-shadow-sm">
          家庭记账
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-white/85">
          {mode === "login"
            ? "输入已有家庭的 6 位数字编码进入账本。"
            : "新建家庭后将自动添加成员「布布」「一二」，可用新编码登录。"}
        </p>
      </header>

      <div className="flex rounded-2xl bg-white/20 p-1 ring-1 ring-white/30">
        <button
          type="button"
          onClick={() => onModeChange("login")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
            mode === "login"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-white/90"
          }`}
        >
          加入家庭
        </button>
        <button
          type="button"
          onClick={() => onModeChange("create")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
            mode === "create"
              ? "bg-white text-pink-600 shadow-sm"
              : "text-white/90"
          }`}
        >
          创建新家
        </button>
      </div>

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-2xl bg-white/95 p-6 shadow-xl shadow-orange-500/15 ring-1 ring-orange-100/80"
      >
        {mode === "create" && (
          <>
            <label className="block text-center text-xs font-medium text-stone-500">
              家庭名称
            </label>
            <input
              type="text"
              placeholder="例如：我们的小家"
              value={householdName}
              autoFocus={mode === "create"}
              onChange={(e) => {
                setHouseholdName(e.target.value);
                setError(null);
              }}
              className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-800 outline-none ring-orange-200 focus:ring-2"
              maxLength={60}
            />
          </>
        )}

        <p
          className={`text-center text-xs font-medium text-stone-500 ${
            mode === "create" ? "mt-5" : ""
          }`}
        >
          家庭编码（6 位数字，创建后请牢记）
        </p>
        {DigitRow}

        {error && (
          <p className="mt-4 text-center text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}

        {mode === "login" ? (
          <button
            type="button"
            disabled={pending || codeString.length !== 6}
            onClick={submitLogin}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-pink-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-500/35 transition active:scale-[0.98] disabled:opacity-50"
          >
            {pending ? "验证中…" : "进入账本"}
          </button>
        ) : (
          <button
            type="button"
            disabled={
              pending || codeString.length !== 6 || !householdName.trim()
            }
            onClick={submitCreate}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-pink-500 via-orange-500 to-orange-400 py-3.5 text-base font-semibold text-white shadow-lg shadow-pink-500/35 transition active:scale-[0.98] disabled:opacity-50"
          >
            {pending ? "创建中…" : "创建并进入"}
          </button>
        )}

        {mode === "login" && (
          <p className="mt-4 text-center text-xs text-stone-400">
            示例编码：<span className="font-mono text-stone-600">000001</span>
          </p>
        )}
      </motion.div>
    </div>
  );
}
