"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearHouseholdSession } from "@/app/actions/household";
import { HOUSEHOLD_CODE_STORAGE_KEY } from "@/lib/household";

export function SwitchHouseholdButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await clearHouseholdSession();
          localStorage.removeItem(HOUSEHOLD_CODE_STORAGE_KEY);
          router.push("/login");
          router.refresh();
        });
      }}
      className="w-full rounded-2xl border border-stone-200 bg-white py-3 text-sm font-medium text-stone-600 transition hover:bg-stone-50 active:scale-[0.99] disabled:opacity-50"
    >
      {pending ? "处理中…" : "切换家庭 / 重新输入编码"}
    </button>
  );
}
