import { SubpageHeader } from "@/components/common/SubpageHeader";
import { SwitchHouseholdButton } from "@/components/features/household/SwitchHouseholdButton";
import { getHouseholdCodeFromCookies } from "@/lib/household/server";

export default async function SettingsPage() {
  const householdCode = (await getHouseholdCodeFromCookies()) ?? "";

  return (
    <div className="space-y-5">
      <SubpageHeader backHref="/members" title="家庭设置" />

      {householdCode ? (
        <section className="paper-panel px-4 py-3">
          <p className="text-xs font-medium text-stone-500">家庭编码</p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-wider text-ink">
            {householdCode}
          </p>
          <p className="mt-1 text-[11px] text-stone-400">
            分享给家人即可加入同一账本
          </p>
        </section>
      ) : null}

      <SwitchHouseholdButton />
    </div>
  );
}
