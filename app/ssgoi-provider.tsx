"use client";

import { type ReactNode } from "react";
import { Ssgoi } from "@ssgoi/react";
import { drill, fade } from "@ssgoi/react/view-transitions";

/**
 * 路由过渡规则：
 * - 嵌套页（统计分析、成员详情等）用 drill，体现父子层级
 * - 其余（底部 Tab 互切、登录进出）用 fade，避免无层级关系的左右推入
 */
const config = {
  transitions: [
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
    {
      priority: -100,
      on: "/**",
      transition: fade(),
    },
  ],
};

export function SsgoiProvider({ children }: { children: ReactNode }) {
  return <Ssgoi config={config}>{children}</Ssgoi>;
}
