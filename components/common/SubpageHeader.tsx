import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * 二级页固定顶栏：返回 + 居中标题 + 可选右侧操作。
 * 使用 viewport `fixed`（非 sticky）：弹层/滚轮手势下也不会被 iOS 橡皮筋带着跑。
 * 下方占位条抵消壳层 top padding，避免正文被顶栏挡住。
 * 样式对齐设计稿：奶油洗色顶栏。
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
        className="paper-header-subpage fixed left-1/2 top-0 z-30 w-full max-w-md -translate-x-1/2 border-b border-[color:var(--line)]"
        style={{
          paddingTop: "max(0.65rem, env(safe-area-inset-top))",
        }}
      >
        <div className="relative z-[1] flex items-center gap-1 px-2 pb-2.5">
          <Link
            href={backHref}
            aria-label={backLabel}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper/70 text-ink shadow-sm shadow-stone-900/5 transition hover:bg-accent-soft active:scale-[0.97]"
          >
            <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
          </Link>

          <div className="min-w-0 flex-1 text-center">
            <h1 className="page-title truncate text-[17px] leading-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 truncate text-[11px] leading-snug text-[color:var(--muted)]">
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
