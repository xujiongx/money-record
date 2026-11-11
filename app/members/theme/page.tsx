import { SubpageHeader } from "@/components/common/SubpageHeader";
import { ThemePicker } from "@/components/features/household/ThemePicker";

export default function ThemePage() {
  return (
    <div className="space-y-5">
      <SubpageHeader
        backHref="/members"
        title="颜色主题"
        subtitle="只改本机外观，不影响账本数据"
      />
      <ThemePicker />
    </div>
  );
}
