"use client";

import { type ReactNode } from "react";
import { Ssgoi } from "@ssgoi/react";
import { drill, slide } from "@ssgoi/react/view-transitions";
import { PRIMARY_TAB_ORDER } from "@/lib/navigation/shell-tabs";

/**
 * 路由过渡规则：
 * - 一级 Tab 点击互切用 slide
 * - 嵌套二级页用 drill
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
