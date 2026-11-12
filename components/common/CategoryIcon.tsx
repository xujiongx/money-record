import { categoryVisual } from "@/lib/branding/category-visual";

const SIZE = {
  sm: { box: "size-9", icon: 16 },
  md: { box: "size-11", icon: 20 },
} as const;

/** 设计稿分类色块图标（圆角方底） */
export function CategoryIcon({
  name,
  size = "sm",
  className = "",
}: {
  name: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const visual = categoryVisual(name);
  const Icon = visual.icon;
  const dim = SIZE[size];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl ${dim.box} ${className}`}
      style={{ background: visual.bg, color: visual.fg }}
      aria-hidden
    >
      <Icon size={dim.icon} strokeWidth={2.25} />
    </span>
  );
}
