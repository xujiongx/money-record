"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/**
 * 二级页轻顶栏：返回 + 标题，跟内容一起滚动（不再 fixed 奶油洗色条）。
 * `historyBack` 时优先浏览器历史返回（多入口进入同一页时少踩一层中间页）。
 */
export function SubpageHeader({
  backHref,
  backLabel = "返回",
  title,
  subtitle,
  right,
  historyBack = false,
}: {
  backHref: string;
  backLabel?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  /** 有历史栈时 router.back()，否则落到 backHref */
  historyBack?: boolean;
}) {
  const router = useRouter();

  const backClassName =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-ink shadow-[var(--shadow-soft)] transition hover:bg-accent-soft active:scale-[0.97]";

  const backControl = historyBack ? (
    <button
      type="button"
      aria-label={backLabel}
      className={backClassName}
      onClick={() => {
        // Next 客户端跳转不会更新 document.referrer，一律跟历史栈返回
        router.back();
      }}
    >
      <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
    </button>
  ) : (
    <Link href={backHref} aria-label={backLabel} className={backClassName}>
      <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
    </Link>
  );

  return (
    <header className="mb-4 flex items-center gap-1">
      {backControl}

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
