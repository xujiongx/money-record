import {
  fetch as undiciFetch,
  ProxyAgent,
  type RequestInit as UndiciRequestInit,
} from "undici";

/**
 * 使用动态 key 读取，避免 Turbopack/Webpack 在编译期把 process.env.* 内联成 undefined。
 * @see https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#bundling-environment-variables-for-the-browser
 */
export function readEnv(key: string): string | undefined {
  const v = process.env[key];
  if (v === undefined) return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

export function resolveProxyUrl(): string | undefined {
  return (
    readEnv("MISTRAL_PROXY_URL") ??
    readEnv("HTTPS_PROXY") ??
    readEnv("https_proxy") ??
    readEnv("HTTP_PROXY") ??
    readEnv("http_proxy")
  );
}

let proxyAgentCache: { url: string; agent: ProxyAgent } | undefined;

function getProxyDispatcher(): ProxyAgent | undefined {
  const url = resolveProxyUrl();
  if (!url) return undefined;
  if (!proxyAgentCache || proxyAgentCache.url !== url) {
    void proxyAgentCache?.agent.close().catch(() => {});
    proxyAgentCache = { url, agent: new ProxyAgent({ uri: url }) };
  }
  return proxyAgentCache.agent;
}

const DEFAULT_TIMEOUT_MS = 120_000;

function upstreamTimeoutMs(): number {
  const raw = readEnv("MISTRAL_FETCH_TIMEOUT_MS");
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
}

/**
 * Node 侧上游请求：undici 外挂包（见 next.config serverExternalPackages）。
 * 有代理时走 ProxyAgent；无代理则直连。默认请求超时见 MISTRAL_FETCH_TIMEOUT_MS。
 */
export function fetchUpstream(url: string, init: UndiciRequestInit) {
  const dispatcher = getProxyDispatcher();
  const { signal, ...rest } = init;
  const effectiveSignal = signal ?? AbortSignal.timeout(upstreamTimeoutMs());
  return undiciFetch(url, {
    ...rest,
    signal: effectiveSignal,
    ...(dispatcher ? { dispatcher } : {}),
  });
}

export function isProxyConfigured(): boolean {
  return Boolean(resolveProxyUrl());
}

export function serializeFetchError(err: unknown): {
  message: string;
  cause?: string;
  code?: string;
} {
  const e = err as Error & { cause?: Error & { code?: string } };
  const message = e instanceof Error ? e.message : "请求上游失败";
  const cause =
    e?.cause instanceof Error
      ? e.cause.message
      : e?.cause != null &&
          typeof e.cause === "object" &&
          "message" in e.cause
        ? String((e.cause as { message?: string }).message)
        : undefined;
  const code =
    e?.cause != null &&
    typeof e.cause === "object" &&
    "code" in e.cause &&
    typeof (e.cause as { code?: unknown }).code === "string"
      ? (e.cause as { code: string }).code
      : undefined;
  return { message, cause, code };
}

/** 开发环境拼进抛错，便于终端排查 */
export function formatUpstreamDevDetail(cause?: string, code?: string): string {
  if (process.env.NODE_ENV !== "development") return "";
  const parts = [cause, code].filter(Boolean);
  return parts.length > 0 ? ` [${parts.join(" · ")}]` : "";
}

export function mistralConnectHint(proxyUsed: boolean): string {
  return proxyUsed
    ? "已通过代理请求仍失败：请确认代理已开、端口与 .env.local 一致（可用 MISTRAL_PROXY_URL 单独指定），并查看日志中的 cause/code。"
    : "无法连上 api.mistral.ai。请在 .env.local 设置 HTTPS_PROXY=http://127.0.0.1:7890（或 MISTRAL_PROXY_URL），并重启 npm run dev。";
}
