"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  getAvatarBitmap,
  loadAvatarBitmap,
  resolveAvatarSrc,
} from "@/lib/avatar/bitmap-cache";

/** 暖橙实色 fallback（与默认 warm 主题一致） */
const solidFalls = [
  "bg-[#f47732]",
  "bg-[#ffb347]",
  "bg-[#ff4d4f]",
  "bg-[#52c41a]",
];

type PaintStatus = "pending" | "ready" | "error";

/** 首屏状态不得读客户端 bitmap 缓存，否则 SSR pending / CSR ready 会 hydration 不一致 */
function initialStatus(src: string | null): PaintStatus {
  return src ? "pending" : "error";
}

function paintBitmap(
  canvas: HTMLCanvasElement,
  bmp: ImageBitmap,
  px: number,
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(px * dpr);
  canvas.height = Math.round(px * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, px, px);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, px, px);
}

/**
 * 头像：用模块级 ImageBitmap 缓存。
 * SSGOI / 路由切换会重挂载组件，移动 WebKit 常丢掉已解码位图导致闪一下；
 * 命中缓存时在 useLayoutEffect 里同步画到 canvas，首帧即可显示。
 */
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
  const g = solidFalls[hash % solidFalls.length];
  const dim =
    size === "lg"
      ? "h-16 w-16 text-xl"
      : size === "sm"
        ? "h-10 w-10 text-sm"
        : "h-12 w-12 text-lg";
  const px = size === "lg" ? 64 : size === "sm" ? 40 : 48;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<PaintStatus>(() => initialStatus(src));
  const [trackedSrc, setTrackedSrc] = useState(src);

  // props 变化时在 render 阶段对齐状态，避免在 effect 里同步 setState
  if (src !== trackedSrc) {
    setTrackedSrc(src);
    setStatus(initialStatus(src));
  }

  useLayoutEffect(() => {
    if (!src) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const cached = getAvatarBitmap(src);
    if (cached) {
      paintBitmap(canvas, cached, px);
      setStatus("ready");
      return;
    }

    void loadAvatarBitmap(src)
      .then((bmp) => {
        if (cancelled) return;
        const el = canvasRef.current;
        if (!el) return;
        paintBitmap(el, bmp, px);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [src, px]);

  if (!src || status === "error") {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-paper ring-1 ring-[var(--line)] ${g} ${dim} ${className}`}
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  const drawn = status === "ready";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-paper ring-1 ring-[var(--line)] ${dim} ${className}`}
    >
      {!drawn && (
        <span
          className={`absolute inset-0 flex items-center justify-center font-semibold text-paper ${g}`}
          aria-hidden
        >
          {initial}
        </span>
      )}
      <canvas
        ref={canvasRef}
        className={`h-full w-full object-cover ${drawn ? "opacity-100" : "opacity-0"}`}
        style={{ width: px, height: px }}
        aria-hidden
      />
    </div>
  );
}
