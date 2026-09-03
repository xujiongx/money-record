"use client";

import { type ReactNode } from "react";
import { Ssgoi } from "@ssgoi/react";
import { drill, slide } from "@ssgoi/react/view-transitions";
import { PRIMARY_TAB_ORDER } from "@/lib/navigation/shell-tabs";

/**
 * 路由过渡规则：
 * - 底部 Tab 互切用 slide（有序推入，避免 fade-through 中间闪白）
 * - 嵌套二级页用 drill
 * - 无兜底 fade：登录等非 Tab 跳转直接切换，更干净
 */
const config = {
  transitions: [
    {
      ordered: [...PRIMARY_TAB_ORDER],
      transition: slide(),
    },
    {
      on: "/stats/**",
      except: "/stats",
      transition: drill(),
    },
    {
      on: "/members/**",
      except: "/members",
      transition: drill(),
    },
  ],
};

export function SsgoiProvider({ children }: { children: ReactNode }) {
  return <Ssgoi config={config}>{children}</Ssgoi>;
}
