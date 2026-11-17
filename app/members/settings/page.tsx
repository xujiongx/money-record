import Link from "next/link";
import { ChevronRight, Shield } from "lucide-react";
import { SubpageHeader } from "@/components/common/SubpageHeader";
import { SwitchHouseholdButton } from "@/components/features/household/SwitchHouseholdButton";
import { WhoAmISettings } from "@/components/features/household/WhoAmISettings";
import { SetupPrompt } from "@/components/features/household/SetupPrompt";
import { ADMIN_ENTRY_HOUSEHOLD_CODE } from "@/lib/admin/constants";
import { getHouseholdCodeFromCookies } from "@/lib/household/server";
import { fetchMembers } from "@/app/actions/ledger";

export default async function SettingsPage() {
  const householdCode = (await getHouseholdCodeFromCookies()) ?? "";
  const showAdminEntry = householdCode === ADMIN_ENTRY_HOUSEHOLD_CODE;

  let members;
  try {
    members = await fetchMembers();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "无法加载设置，请检查环境变量与迁移脚本。";
    return <SetupPrompt message={message} />;
  }

  return (
    <div className="space-y-5">
      <SubpageHeader backHref="/members" title="家庭设置" />

      {householdCode ? (
        <section className="paper-panel px-4 py-3">
          <p className="text-xs font-medium text-stone-500">家庭编码</p>
          <p className="mt-1 font-mono text-lg font-semibold text-ink">
            {householdCode}
          </p>
          <p className="mt-1 text-[11px] text-stone-400">
            分享给家人即可加入同一账本
          </p>
        </section>
      ) : null}

      <WhoAmISettings members={members} />

      {showAdminEntry ? (
        <Link
          href="/admin"
          className="paper-panel flex items-center gap-3 p-4 transition hover:bg-accent-soft/40 active:scale-[0.99]"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-paper">
            <Shield className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">管理后台</p>
            <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
              审核新家庭创建申请
            </p>
          </div>
          <ChevronRight
            className="size-5 shrink-0 text-stone-300"
            strokeWidth={2.25}
            aria-hidden
          />
        </Link>
      ) : null}

      <SwitchHouseholdButton />
    </div>
  );
}
