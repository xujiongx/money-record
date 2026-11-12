import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * 二级页轻顶栏：返回 + 标题，跟内容一起滚动（不再 fixed 奶油洗色条）。
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
    <header className="mb-4 flex items-center gap-1">
      <Link
        href={backHref}
        aria-label={backLabel}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-ink shadow-[var(--shadow-soft)] transition hover:bg-accent-soft active:scale-[0.97]"
      >
        <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
      </Link>

      <div className="min-w-0 flex-1 text-center">
        <h1 className="page-title truncate text-[17px] leading-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[11px] leading-snug text-[color:var(--muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
        {right ?? <span className="w-10" aria-hidden />}
      </div>
    </header>
  );
}
