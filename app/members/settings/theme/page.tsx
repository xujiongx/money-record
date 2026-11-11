import { SubpageHeader } from "@/components/common/SubpageHeader";
import { ThemePicker } from "@/components/features/household/ThemePicker";

export default function ThemeSettingsPage() {
  return (
    <div className="space-y-5">
      <SubpageHeader
        backHref="/members/settings"
        title="主题设置"
        subtitle="只改本机外观，不影响账本数据"
      />
      <ThemePicker />
    </div>
  );
}
