import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * 二级页固定顶栏：返回 + 居中标题 + 可选右侧操作。
 * 用负边距抵消壳层 padding，贴齐视口顶部（含安全区）。
 * 实色浅底 + 深色字，避免滚过渐变后白字落在浅色内容上发虚。
 */
export function SubpageHeader({
  backHref,
  backLabel = "返回",
  title,
  subtitle,
  right,
}: {
  backHref: string;
  backLabel?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header
      className="sticky top-0 z-30 -mx-4 mb-5 border-b border-orange-100/90 bg-[#fff7f5]/95 shadow-[0_8px_24px_rgba(249,115,22,0.08)] backdrop-blur-xl"
      style={{
        marginTop: "calc(-1 * max(1.5rem, env(safe-area-inset-top)))",
        paddingTop: "max(0.65rem, env(safe-area-inset-top))",
      }}
    >
      <div className="flex items-center gap-1 px-2 pb-2.5">
        <Link
          href={backHref}
          aria-label={backLabel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-stone-700 transition hover:bg-orange-50 active:scale-[0.97]"
        >
          <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
        </Link>

        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-[17px] font-bold leading-tight text-stone-800">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[11px] leading-snug text-stone-500">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
          {right ?? <span className="w-10" aria-hidden />}
        </div>
      </div>
    </header>
  );
}
