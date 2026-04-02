"use client";

import Image from "next/image";

const gradients = [
  "from-orange-400 to-pink-500",
  "from-rose-400 to-orange-400",
  "from-amber-400 to-rose-500",
  "from-fuchsia-400 to-orange-400",
];

/** 默认成员头像（静态资源在 public/） */
const DEFAULT_NAME_AVATAR: Record<string, string> = {
  布布: "/bubu.png",
  一二: "/12.png",
};

function resolveAvatarSrc(
  name: string,
  avatarUrl: string | null | undefined,
): string | null {
  if (avatarUrl?.trim()) return avatarUrl;
  return DEFAULT_NAME_AVATAR[name] ?? null;
}

export function MemberAvatar({
  name,
  avatarUrl,
  size = "md",
  className = "",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const src = resolveAvatarSrc(name, avatarUrl);
  const initial = name.slice(0, 1);
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const g = gradients[hash % gradients.length];
  const dim =
    size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-10 w-10 text-sm" : "h-12 w-12 text-lg";
  const imgSizes =
    size === "lg" ? 64 : size === "sm" ? 40 : 48;

  if (src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full shadow-md ring-2 ring-white/80 ${dim} ${className}`}
      >
        <Image
          src={src}
          alt=""
          width={imgSizes}
          height={imgSizes}
          className="h-full w-full object-cover"
          sizes={`${imgSizes}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-md ring-2 ring-white/80 ${g} ${dim} ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
