"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { persistChatExchangeAction } from "@/app/actions/chat-history";
import {
  generateMonthlySummaryAction,
  generateYearlySummaryAction,
  mistralLedgerChatAction,
  type MistralChatMessage,
} from "@/app/actions/mistral-chat";
import {
  SUMMARY_SHORTCUT_MONTHLY,
  SUMMARY_SHORTCUT_YEARLY,
} from "@/components/features/chat/summary-shortcuts";
import {
  type ChatUiMessage,
  newChatMessageId,
} from "@/components/features/chat/types";
import { ChatFabTrigger } from "@/components/features/chat/trigger/ChatFabTrigger";
import { FloatingChatPanel } from "@/components/features/chat/panel/FloatingChatPanel";
import { useChatHistoryLoader } from "@/components/features/chat/useChatHistoryLoader";

/** 小布助手：可拖动入口 + 对话浮层 */
export function FloatingChatBot() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** 模型请求失败且最后一条为用户消息时，展示「重试」 */
  const [requestNeedsRetry, setRequestNeedsRetry] = useState(false);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  const onHistoryLoadStart = useCallback(() => {
    setError(null);
    setRequestNeedsRetry(false);
  }, []);

  const {
    messages,
    setMessages,
    historyLoading,
    appendExchangeToCache,
  } = useChatHistoryLoader({
    open,
    mounted,
    setError,
    onHistoryLoadStart,
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOx = html.style.overflowX;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflowX = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflowX = prevHtmlOx;
      body.style.overflow = prevBodyOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [messages, open, pending]);

  const retryLastRequest = useCallback(() => {
    if (pending || historyLoading) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "user") return;
    const text = last.content;
    const prior: MistralChatMessage[] = messages.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    setError(null);
    setRequestNeedsRetry(false);
    startTransition(async () => {
      const isMonthly = text === SUMMARY_SHORTCUT_MONTHLY;
      const isYearly = text === SUMMARY_SHORTCUT_YEARLY;
      let reply: string;
      if (isMonthly) {
        const result = await generateMonthlySummaryAction();
        if (!result.ok) {
          setError(result.error);
          setRequestNeedsRetry(true);
          return;
        }
        reply = result.data;
      } else if (isYearly) {
        const result = await generateYearlySummaryAction();
        if (!result.ok) {
          setError(result.error);
          setRequestNeedsRetry(true);
          return;
        }
        reply = result.data;
      } else {
        const result = await mistralLedgerChatAction(prior, text);
        if (!result.ok) {
          setError(result.error);
          setRequestNeedsRetry(true);
          return;
        }
        reply = result.reply;
      }
      const assistantMsg: ChatUiMessage = {
        id: newChatMessageId(),
        role: "assistant",
        content: reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      const saved = await persistChatExchangeAction(text, reply);
      if (!saved.ok) {
        setError(`对话已显示，但未写入历史：${saved.error}`);
      } else {
        appendExchangeToCache(last, assistantMsg);
      }
    });
  }, [messages, pending, historyLoading, appendExchangeToCache, setMessages]);

  const sendUserMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending || historyLoading) return;
    setError(null);
    setRequestNeedsRetry(false);
    const userMsg: ChatUiMessage = {
      id: newChatMessageId(),
      role: "user",
      content: trimmed,
    };
    const prior: MistralChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    startTransition(async () => {
      let assistantContent: string;
      if (trimmed === SUMMARY_SHORTCUT_MONTHLY) {
        const result = await generateMonthlySummaryAction();
        if (!result.ok) {
          setError(result.error);
          setRequestNeedsRetry(true);
          return;
        }
        assistantContent = result.data;
      } else if (trimmed === SUMMARY_SHORTCUT_YEARLY) {
        const result = await generateYearlySummaryAction();
        if (!result.ok) {
          setError(result.error);
          setRequestNeedsRetry(true);
          return;
        }
        assistantContent = result.data;
      } else {
        const result = await mistralLedgerChatAction(prior, trimmed);
        if (!result.ok) {
          setError(result.error);
          setRequestNeedsRetry(true);
          return;
        }
        assistantContent = result.reply;
      }
      const assistantMsg: ChatUiMessage = {
        id: newChatMessageId(),
        role: "assistant",
        content: assistantContent,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      const saved = await persistChatExchangeAction(trimmed, assistantContent);
      if (!saved.ok) {
        setError(`对话已显示，但未写入历史：${saved.error}`);
      } else {
        appendExchangeToCache(userMsg, assistantMsg);
      }
    });
  };

  const onMonthlyShortcut = () => {
    if (pending || historyLoading) return;
    setError(null);
    setRequestNeedsRetry(false);
    const userMsg: ChatUiMessage = {
      id: newChatMessageId(),
      role: "user",
      content: SUMMARY_SHORTCUT_MONTHLY,
    };
    setMessages((prev) => [...prev, userMsg]);
    startTransition(async () => {
      const result = await generateMonthlySummaryAction();
      if (!result.ok) {
        setError(result.error);
        setRequestNeedsRetry(true);
        return;
      }
      const assistantMsg: ChatUiMessage = {
        id: newChatMessageId(),
        role: "assistant",
        content: result.data,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      const saved = await persistChatExchangeAction(
        SUMMARY_SHORTCUT_MONTHLY,
        result.data,
      );
      if (!saved.ok) {
        setError(`对话已显示，但未写入历史：${saved.error}`);
      } else {
        appendExchangeToCache(userMsg, assistantMsg);
      }
    });
  };

  const onYearlyShortcut = () => {
    if (pending || historyLoading) return;
    setError(null);
    setRequestNeedsRetry(false);
    const userMsg: ChatUiMessage = {
      id: newChatMessageId(),
      role: "user",
      content: SUMMARY_SHORTCUT_YEARLY,
    };
    setMessages((prev) => [...prev, userMsg]);
    startTransition(async () => {
      const result = await generateYearlySummaryAction();
      if (!result.ok) {
        setError(result.error);
        setRequestNeedsRetry(true);
        return;
      }
      const assistantMsg: ChatUiMessage = {
        id: newChatMessageId(),
        role: "assistant",
        content: result.data,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      const saved = await persistChatExchangeAction(
        SUMMARY_SHORTCUT_YEARLY,
        result.data,
      );
      if (!saved.ok) {
        setError(`对话已显示，但未写入历史：${saved.error}`);
      } else {
        appendExchangeToCache(userMsg, assistantMsg);
      }
    });
  };

  if (!mounted) return null;

  return (
    <>
      <ChatFabTrigger
        onOpen={() => {
          setOpen(true);
          setError(null);
          setRequestNeedsRetry(false);
        }}
      />
      <FloatingChatPanel
        open={open}
        onDismiss={() => setOpen(false)}
        listRef={listRef}
        historyLoading={historyLoading}
        messages={messages}
        pending={pending}
        error={error}
        onRequestRetry={requestNeedsRetry ? retryLastRequest : null}
        input={input}
        onInputChange={setInput}
        onMonthlyShortcut={onMonthlyShortcut}
        onYearlyShortcut={onYearlyShortcut}
        onSend={() => sendUserMessage(input)}
      />
    </>
  );
}
