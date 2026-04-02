"use client";

const gradients = [
  "from-orange-400 to-pink-500",
  "from-rose-400 to-orange-400",
  "from-amber-400 to-rose-500",
  "from-fuchsia-400 to-orange-400",
];

export function MemberAvatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initial = name.slice(0, 1);
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const g = gradients[hash % gradients.length];
  const dim =
    size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-10 w-10 text-sm" : "h-12 w-12 text-lg";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-md ring-2 ring-white/80 ${g} ${dim} ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
