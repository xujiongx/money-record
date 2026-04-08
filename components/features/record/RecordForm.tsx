"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createTransaction } from "@/app/actions/ledger";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/ledger/categories";
import type { LedgerType, MemberRow } from "@/lib/ledger/types";
import { MemberAvatar } from "@/components/common/MemberAvatar";

export function RecordForm({ members }: { members: MemberRow[] }) {
  const router = useRouter();
  const [type, setType] = useState<LedgerType>("expense");
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [category, setCategory] = useState<string>(
    EXPENSE_CATEGORIES[0] ?? "其他",
  );
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const categories = useMemo(
    () =>
      type === "expense"
        ? [...EXPENSE_CATEGORIES]
        : [...INCOME_CATEGORIES],
    [type],
  );

  const onTypeChange = (next: LedgerType) => {
    setType(next);
    setCategory(
      next === "expense"
        ? EXPENSE_CATEGORIES[0]
        : INCOME_CATEGORIES[0],
    );
  };

  const submit = () => {
    setError(null);
    const n = parseFloat(amount.replace(/,/g, ""));
    if (!memberId) {
      setError("请选择记录人");
      return;
    }
    if (!Number.isFinite(n) || n <= 0) {
      setError("请输入有效金额");
      return;
    }
    startTransition(async () => {
      try {
        await createTransaction({
          memberId,
          type,
          category,
          amount: n,
          note: note.trim() || undefined,
        });
        setAmount("");
        setNote("");
        router.push("/");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存失败");
      }
    });
  };
  console.log(222, members);


  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-medium text-white/90">快速记账</p>
        <h1 className="mt-1 text-2xl font-bold text-white drop-shadow-sm">
          记一笔
        </h1>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80"
      >
        <div className="flex rounded-2xl bg-stone-100/80 p-1">
          <button
            type="button"
            onClick={() => onTypeChange("expense")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
              type === "expense"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-stone-500"
            }`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => onTypeChange("income")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
              type === "income"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-stone-500"
            }`}
          >
            收入
          </button>
        </div>

        <label className="mt-5 block text-xs font-medium text-stone-500">
          金额（元）
        </label>
        <input
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-2xl font-bold text-stone-800 outline-none ring-orange-200 focus:ring-2"
        />

        <label className="mt-4 block text-xs font-medium text-stone-500">
          分类
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition active:scale-[0.98] ${
                category === c
                  ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="mt-5 text-xs font-medium text-stone-500">记录人</p>
        <div className="mt-2 flex gap-3">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMemberId(m.id)}
              className={`flex flex-1 flex-col items-center rounded-2xl border-2 py-3 transition active:scale-[0.98] ${
                memberId === m.id
                  ? "border-orange-400 bg-orange-50/80"
                  : "border-transparent bg-stone-50"
              }`}
            >
              <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
              <span className="mt-2 text-sm font-medium text-stone-800">
                {m.name}
              </span>
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs font-medium text-stone-500">
          备注（可选）
        </label>
        <input
          type="text"
          placeholder="写点什么…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 outline-none ring-orange-200 focus:ring-2"
        />

        {error && (
          <p className="mt-3 text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-pink-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-500/35 transition active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "保存中…" : "保存记录"}
        </button>
      </motion.div>
    </div>
  );
}
