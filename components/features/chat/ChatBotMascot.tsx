"use client";

import { useId } from "react";

type ChatBotMascotProps = {
  className?: string;
  /** fab：完整漂浮+眨眼+天线；header：仅眨眼，适合标题栏 */
  variant?: "fab" | "header";
};

/**
 * 小布吉祥物：渐变造型 + SVG 原生动画（漂浮、眨眼、天线摆动）。
 */
export function ChatBotMascot({
  className,
  variant = "fab",
}: ChatBotMascotProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "_");
  const bodyGrad = `cbm-body-${uid}`;
  const faceGrad = `cbm-face-${uid}`;
  const glowGrad = `cbm-glow-${uid}`;
  const fullAnim = variant === "fab";

  return (
    <svg
      className={className}
      viewBox="0 0 100 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient
          id={bodyGrad}
          x1="22"
          y1="18"
          x2="88"
          y2="98"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff7ed" />
          <stop offset="0.45" stopColor="#ffedd5" />
          <stop offset="1" stopColor="#fdba74" />
        </linearGradient>
        <linearGradient
          id={faceGrad}
          x1="50"
          y1="36"
          x2="50"
          y2="72"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff7ed" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient
          id={glowGrad}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(50 48) rotate(90) scale(38 44)"
        >
          <stop stopColor="#fb923c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
      </defs>

      {fullAnim && (
        <ellipse
          cx="50"
          cy="92"
          rx="28"
          ry="5"
          fill="#000"
          fillOpacity="0.08"
        >
          <animate
            attributeName="rx"
            values="28;22;28"
            dur="2.4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.08;0.05;0.08"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </ellipse>
      )}

      <g>
        {fullAnim && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-2.5; 0,0"
            dur="2.4s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
          />
        )}

        {/* 天线 */}
        <g>
          {fullAnim && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-6 50 28; 6 50 28; -6 50 28"
              dur="1.8s"
              repeatCount="indefinite"
            />
          )}
          <path
            d="M50 28V42"
            stroke="#f97316"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="50" cy="24" r="7" fill="#fb923c" />
          <circle cx="50" cy="24" r="3.5" fill="#fff" fillOpacity="0.5" />
        </g>

        {/* 身体主形 */}
        <path
          d="M28 42c0-8 8-16 22-16s22 8 22 16v26c0 10-8 18-22 18S28 78 28 68V42z"
          fill={`url(#${bodyGrad})`}
          stroke="#f97316"
          strokeWidth="1.5"
          strokeOpacity="0.35"
        />

        <ellipse cx="50" cy="56" rx="26" ry="24" fill={`url(#${glowGrad})`} />

        {/* 脸 */}
        <ellipse
          cx="50"
          cy="54"
          rx="22"
          ry="20"
          fill={`url(#${faceGrad})`}
          stroke="#fed7aa"
          strokeWidth="1"
        />

        {/* 腮红 */}
        <ellipse cx="34" cy="58" rx="4" ry="2.5" fill="#fda4af" fillOpacity="0.45" />
        <ellipse cx="66" cy="58" rx="4" ry="2.5" fill="#fda4af" fillOpacity="0.45" />

        {/* 眼睛 */}
        <g fill="#44403c">
          <ellipse cx="40" cy="52" rx="3.8" ry="4.8">
            <animate
              attributeName="ry"
              values="4.8;0.6;4.8;4.8;4.8"
              keyTimes="0;0.04;0.08;0.12;1"
              dur="3.2s"
              repeatCount="indefinite"
            />
          </ellipse>
          <ellipse cx="60" cy="52" rx="3.8" ry="4.8">
            <animate
              attributeName="ry"
              values="4.8;0.6;4.8;4.8;4.8"
              keyTimes="0;0.04;0.08;0.12;1"
              dur="3.2s"
              repeatCount="indefinite"
            />
          </ellipse>
        </g>
        <circle cx="41.2" cy="50.5" r="1.2" fill="#fff" fillOpacity="0.9" />
        <circle cx="61.2" cy="50.5" r="1.2" fill="#fff" fillOpacity="0.9" />

        {/* 微笑 */}
        <path
          d="M40 62 Q50 69 60 62"
          stroke="#ea580c"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.75"
        />

        {/* 胸口小爱心 */}
        <path
          d="M50 74c-2.5-2.2-6-1.8-6 1.4 0 2.8 2.8 5 6 7.2 3.2-2.2 6-4.4 6-7.2 0-3.2-3.5-3.6-6-1.4z"
          fill="#fb7185"
          fillOpacity="0.55"
        />
      </g>
    </svg>
  );
}
