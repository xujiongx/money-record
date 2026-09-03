import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * 二级页固定顶栏：返回 + 居中标题 + 可选右侧操作。
 * 使用 viewport `fixed`（非 sticky）：弹层/滚轮手势下也不会被 iOS 橡皮筋带着跑。
 * 下方占位条抵消壳层 top padding，避免正文被顶栏挡住。
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
    <>
      <header
        className="fixed left-1/2 top-0 z-30 w-full max-w-md -translate-x-1/2 border-b border-orange-100/90 bg-[#fff7f5]/95 shadow-[0_8px_24px_rgba(249,115,22,0.08)] backdrop-blur-xl"
        style={{
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

      {/* 与壳层 pt 对消 + 顶栏内容高度，保持正文起始位置与原先 sticky 一致 */}
      <div
        aria-hidden
        className="mb-5 shrink-0"
        style={{
          marginTop: "calc(-1 * max(1.5rem, env(safe-area-inset-top)))",
          height:
            "calc(max(0.65rem, env(safe-area-inset-top)) + 2.75rem)",
        }}
      />
    </>
  );
}
