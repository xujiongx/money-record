import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** 二级页统一返回：lucide ChevronLeft + 文案 */
export function BackLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 text-sm font-medium text-white/90 transition hover:text-white ${className}`}
    >
      <ChevronLeft className="size-[18px] shrink-0" strokeWidth={2.25} aria-hidden />
      {children}
    </Link>
  );
}
