import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  /** 避免 Turbopack 把 undici 打进包后代理 / CONNECT 行为异常 */
  serverExternalPackages: ["undici"],
};

export default nextConfig;
