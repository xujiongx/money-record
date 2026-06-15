import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  /** 允许局域网 IP 访问 dev server 的 HMR 资源（手机/平板调试用） */
  allowedDevOrigins: ["192.168.1.9"],
  /** 避免 Turbopack 把 undici 打进包后代理 / CONNECT 行为异常 */
  serverExternalPackages: ["undici"],
  /**
   * 客户端对动态路由 RSC 的复用窗口（当前 1h），与账本 `unstable_cache` 的 `revalidate` 同量级。
   * 首页「刷新数据」会 `revalidateTag` + `router.refresh()` 强制重查库。
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes
   */
  experimental: {
    staleTimes: {
      dynamic: 3600,
      static: 3600,
    },
  },
};

export default nextConfig;
