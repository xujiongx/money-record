"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { fetchChatMessagesAction } from "@/app/actions/chat-history";
import type { ChatUiMessage } from "@/components/features/chat/types";

/** 与 `app/actions/chat-history` 中 CHAT_FETCH_LIMIT 对齐 */
const CHAT_HISTORY_UI_CACHE_MAX = 300;

type FetchChatResult = Awaited<ReturnType<typeof fetchChatMessagesAction>>;

function persistedRowsToUi(
  rows: { id: string; role: "user" | "assistant"; content: string }[],
): ChatUiMessage[] {
  return rows.map((m) => ({ id: m.id, role: m.role, content: m.content }));
}

function pushExchangeToCache(
  cacheRef: MutableRefObject<ChatUiMessage[] | null>,
  user: ChatUiMessage,
  assistant: ChatUiMessage,
) {
  const next = [...(cacheRef.current ?? []), user, assistant];
  cacheRef.current =
    next.length > CHAT_HISTORY_UI_CACHE_MAX
      ? next.slice(next.length - CHAT_HISTORY_UI_CACHE_MAX)
      : next;
}

export type UseChatHistoryLoaderParams = {
  open: boolean;
  mounted: boolean;
  setError: Dispatch<SetStateAction<string | null>>;
  /** 打开浮层并开始拉历史前调用（例如清空错误、关闭重试态）；请用 `useCallback` 保持引用稳定，避免重复拉取 */
  onHistoryLoadStart: () => void;
};

export type UseChatHistoryLoaderResult = {
  messages: ChatUiMessage[];
  setMessages: Dispatch<SetStateAction<ChatUiMessage[]>>;
  historyLoading: boolean;
  /** 一轮问答成功落库后同步内存缓存，减少关开面板时的陈旧感 */
  appendExchangeToCache: (user: ChatUiMessage, assistant: ChatUiMessage) => void;
};

/**
 * 小布对话历史：内存缓存、并发去重、空闲预取、打开浮层时 stale-while-revalidate。
 */
export function useChatHistoryLoader({
  open,
  mounted,
  setError,
  onHistoryLoadStart,
}: UseChatHistoryLoaderParams): UseChatHistoryLoaderResult {
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  /** `null` 表示尚未成功拉取过，打开浮层时需全屏加载 */
  const historyCacheRef = useRef<ChatUiMessage[] | null>(null);
  const historyInflightRef = useRef<Promise<FetchChatResult> | null>(null);

  const getSharedHistoryFetch = useCallback((): Promise<FetchChatResult> => {
    const existing = historyInflightRef.current;
    if (existing) return existing;
    const p = fetchChatMessagesAction().finally(() => {
      if (historyInflightRef.current === p) {
        historyInflightRef.current = null;
      }
    });
    historyInflightRef.current = p;
    return p;
  }, []);

  /** 浏览器空闲时预取历史，首次点小布前往往已就绪 */
  useEffect(() => {
    if (!mounted) return;
    const run = () => {
      if (historyCacheRef.current !== null) return;
      void getSharedHistoryFetch().then((r) => {
        if (r.ok) {
          historyCacheRef.current = persistedRowsToUi(r.data);
        }
      });
    };
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(run, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const id = window.setTimeout(run, 1500);
    return () => window.clearTimeout(id);
  }, [mounted, getSharedHistoryFetch]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      const cached = historyCacheRef.current;
      const hasCache = cached !== null;

      onHistoryLoadStart();

      if (hasCache) {
        setMessages(cached);
        setHistoryLoading(false);
      } else {
        setHistoryLoading(true);
        setMessages([]);
      }

      const r = await getSharedHistoryFetch();
      if (cancelled) return;

      if (r.ok) {
        const ui = persistedRowsToUi(r.data);
        historyCacheRef.current = ui;
        setMessages(ui);
      } else if (!hasCache) {
        setMessages([]);
        setError(r.error);
      } else {
        setError(r.error);
      }
      if (!cancelled) {
        setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, getSharedHistoryFetch, setError, onHistoryLoadStart]);

  const appendExchangeToCache = useCallback(
    (user: ChatUiMessage, assistant: ChatUiMessage) => {
      pushExchangeToCache(historyCacheRef, user, assistant);
    },
    [],
  );

  return {
    messages,
    setMessages,
    historyLoading,
    appendExchangeToCache,
  };
}
