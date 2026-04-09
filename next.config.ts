import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  /** 避免 Turbopack 把 undici 打进包后代理 / CONNECT 行为异常 */
  serverExternalPackages: ["undici"],
  /**
   * App Router 客户端对「动态路由」的 RSC 复用窗口。默认 `dynamic: 0` 时几乎每次切 Tab 都会重新拉 Flight，
   * 体感像整页重载。略拉长并与账本 `unstable_cache` 的 120s 对齐；写操作仍会 `revalidatePath` / `revalidateTag` 触发刷新。
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes
   */
  experimental: {
    staleTimes: {
      dynamic: 120,
      static: 300,
    },
  },
};

export default nextConfig;
