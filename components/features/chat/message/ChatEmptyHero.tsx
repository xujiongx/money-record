import { MascotIllustration } from "@/components/common/MascotIllustration";

export function ChatEmptyHero() {
  return (
    <div className="flex flex-col items-center gap-3 py-5">
      <MascotIllustration name="chatEmpty" size="md" alt="" />
      <p className="max-w-[16rem] text-center text-sm leading-relaxed text-[color:var(--muted)]">
        问记账的事，或点下面按钮，让{" "}
        <span className="font-medium text-accent">小布</span>{" "}
        帮你生成本月小结。
      </p>
    </div>
  );
}
