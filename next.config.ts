import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  /**
   * 允许局域网 IP 访问 dev 的 `/_next/*`（含 HMR）。
   * 手机用 `http://<本机局域网IP>:3000` 时，Origin 是该 IP；未列入会被拦，页面像卡住。
   * 本机 IP 变了就改这里，并重启 `next dev`。
   */
  allowedDevOrigins: ["192.168.1.6", "192.168.1.9"],
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
