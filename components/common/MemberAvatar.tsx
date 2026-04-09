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

  /** 本地 `public/` 资源不走 `/_next/image`，避免 dev 下优化接口禁用缓存导致每次进页都像重新拉图 */
  const isRemoteSrc =
    src !== null &&
    (src.startsWith("http://") || src.startsWith("https://"));

  if (src) {
    // 304 仍会校验；移动 WebKit 重挂载时常重解码，解码前一帧易显灰——暖底色 + sync 解码减轻
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full bg-[#fff7f5] shadow-md ring-2 ring-white/80 ${dim} ${className}`}
      >
        <Image
          src={src}
          alt=""
          width={imgSizes}
          height={imgSizes}
          className="h-full w-full object-cover transform-[translateZ(0)]"
          sizes={`${imgSizes}px`}
          unoptimized={!isRemoteSrc}
          decoding={isRemoteSrc ? "async" : "sync"}
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
