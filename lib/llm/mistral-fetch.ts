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

type MistralErrorJson = {
  object?: string;
  message?: string;
  code?: string | number;
  type?: string;
};

function tryParseMistralErrorBody(bodyText: string): MistralErrorJson | null {
  const t = bodyText.trim();
  if (!t.startsWith("{")) return null;
  try {
    const o = JSON.parse(t) as MistralErrorJson;
    if (o && typeof o === "object" && o.object === "error") return o;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * 将 Mistral HTTP 错误体转换为用户可见文案（不向用户展示原始 JSON）。
 */
export function formatMistralHttpErrorForUser(
  httpStatus: number,
  bodyText: string,
): string {
  const parsed = tryParseMistralErrorBody(bodyText);
  const msg = (parsed?.message ?? "").toLowerCase();
  const code = String(parsed?.code ?? "");

  const capacityLike =
    httpStatus === 429 ||
    code === "3505" ||
    msg.includes("capacity") ||
    msg.includes("service_tier") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests");

  if (capacityLike) {
    return "当前使用人数较多或已达到服务额度上限，小布暂时无法回复。请稍等几分钟后再试，或点击「重试」。";
  }

  if (httpStatus === 401 || httpStatus === 403) {
    return "对话服务未正确配置或没有访问权限，请联系维护者检查密钥与套餐。";
  }

  if (httpStatus === 400) {
    return "这次请求无法被处理，请换一句话试试，或稍后再试。";
  }

  if (httpStatus === 503 || httpStatus === 502 || httpStatus === 504) {
    return "智能服务暂时不可用，请稍后再试或点击「重试」。";
  }

  if (httpStatus >= 500) {
    return "对方服务出现异常，请稍后再试。";
  }

  return "小布暂时连接不上智能服务，请检查网络后重试。";
}

/** 网络/超时等上游异常的用户文案（开发环境仍可在抛错处附加 mistralConnectHint） */
export function formatMistralNetworkErrorForUser(err: unknown): string {
  const { message, code } = serializeFetchError(err);
  const m = message.toLowerCase();
  if (
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    code === "ETIMEDOUT" ||
    m.includes("timeout") ||
    m.includes("aborted")
  ) {
    return "连接超时，请检查网络或代理后重试。";
  }
  if (m.includes("econnrefused") || m.includes("enotfound")) {
    return "无法连接到服务，请检查网络或代理设置。";
  }
  return "网络异常，请稍后再试。";
}
