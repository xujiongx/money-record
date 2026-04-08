"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  generateMonthlySummaryAction,
  mistralChatAction,
  type MistralChatMessage,
} from "@/app/actions/mistral-chat";
import { ChatBotMascot } from "@/components/features/chat/ChatBotMascot";
import { DraggableFab } from "@/components/common/DraggableFab";

const OFFSET_STORAGE_KEY = "record-chatbot-offset-v1";

type UiMessage = { id: string; role: "user" | "assistant"; content: string };

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function TypingDots() {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-2"
      role="status"
      aria-label="正在回复"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 shadow-sm"
          animate={{ y: [0, -5, 0], opacity: [0.45, 1, 0.45] }}
          transition={{
            duration: 0.75,
            repeat: Infinity,
            delay: i * 0.14,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/** 小布助手：可拖动入口 + 对话浮层 */
export function FloatingChatBot() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

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

  const sendUserMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setError(null);
    const userMsg: UiMessage = {
      id: newId(),
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
      const result = await mistralChatAction(prior, trimmed);
      if (!result.ok) {
        setError(result.error);
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "assistant", content: result.data },
      ]);
    });
  };

  const onMonthlyShortcut = () => {
    if (pending) return;
    setError(null);
    const userMsg: UiMessage = {
      id: newId(),
      role: "user",
      content: "帮我生成本月小结",
    };
    setMessages((prev) => [...prev, userMsg]);
    startTransition(async () => {
      const result = await generateMonthlySummaryAction();
      if (!result.ok) {
        setError(result.error);
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "assistant", content: result.data },
      ]);
    });
  };

  if (!mounted) return null;

  return (
    <>
      <DraggableFab
        storageKey={OFFSET_STORAGE_KEY}
        aria-label="打开记账助手，可拖动位置"
        className="size-16 rounded-full border border-white/60 bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 text-white shadow-[0_12px_40px_-8px_rgba(249,115,22,0.55),0_0_0_1px_rgba(255,255,255,0.25)_inset] ring-2 ring-white/40 backdrop-blur-sm transition-shadow hover:shadow-[0_14px_44px_-6px_rgba(244,63,94,0.45)] hover:ring-white/55"
        onPress={() => {
          setOpen(true);
          setError(null);
        }}
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_55%)]"
          aria-hidden
        />
        <ChatBotMascot
          variant="fab"
          className="pointer-events-none absolute inset-0 z-10 drop-shadow-md"
        />
      </DraggableFab>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex h-full min-h-0 items-end justify-center bg-stone-900/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md sm:items-center sm:pb-4 sm:pt-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chatbot-title"
            onClick={() => setOpen(false)}
          >
            <div
              className="flex max-h-full w-full max-w-md min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-gradient-to-b from-white via-orange-50/35 to-white shadow-[0_25px_80px_-20px_rgba(249,115,22,0.35),0_0_1px_rgba(0,0,0,0.06)] h-[min(86svh,640px)] sm:h-[min(86dvh,640px)]"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="relative shrink-0 overflow-hidden border-b border-orange-100/90 bg-gradient-to-r from-orange-50 via-white to-pink-50/90 px-4 py-3.5">
                <div
                  className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-orange-200/25 blur-3xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-pink-200/20 blur-2xl"
                  aria-hidden
                />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white/95 shadow-lg shadow-orange-200/40 ring-1 ring-orange-100/80">
                      <ChatBotMascot
                        variant="header"
                        className="absolute inset-0"
                      />
                    </span>
                    <div className="min-w-0">
                      <h2
                        id="chatbot-title"
                        className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-base font-semibold text-transparent"
                      >
                        小布助手
                      </h2>
                      <p className="text-xs text-stone-500">
                        记账问答 · 本月小结
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium text-stone-500 transition hover:bg-white/80 hover:text-stone-700"
                    onClick={() => setOpen(false)}
                  >
                    关闭
                  </button>
                </div>
              </header>

              <div
                ref={listRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain bg-gradient-to-b from-transparent to-orange-50/20 px-4 py-4 [-webkit-overflow-scrolling:touch]"
              >
                {messages.length === 0 && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="relative h-28 w-28 overflow-hidden rounded-3xl bg-white/80 shadow-inner shadow-orange-100/60 ring-1 ring-orange-100/50">
                      <ChatBotMascot
                        variant="header"
                        className="absolute inset-0"
                      />
                    </div>
                    <p className="max-w-[16rem] text-center text-sm leading-relaxed text-stone-500">
                      问我记账相关的问题，或点下方按钮，让{" "}
                      <span className="font-medium text-orange-600">小布</span>{" "}
                      帮你生成本月小结～
                    </p>
                  </div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                        m.role === "user"
                          ? "bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-orange-300/30"
                          : "border border-orange-100/80 bg-white/95 text-stone-800 shadow-orange-100/40"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    </div>
                  </div>
                ))}
                {pending && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl border border-orange-100/90 bg-white/95 px-2 py-1 shadow-sm shadow-orange-100/30">
                      <TypingDots />
                      <span className="pr-2 text-xs text-stone-400">思考中</span>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="shrink-0 border-t border-red-100 bg-red-50/80 px-4 py-2 text-center text-xs text-red-600">
                  {error}
                </p>
              )}

              <div className="shrink-0 border-t border-orange-100/80 bg-gradient-to-t from-orange-50/50 to-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
                <button
                  type="button"
                  disabled={pending}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-200/90 bg-gradient-to-r from-orange-50 to-amber-50 py-2.5 text-sm font-medium text-orange-800 shadow-sm transition hover:border-orange-300 hover:from-orange-100/80 hover:to-amber-50 disabled:opacity-45"
                  onClick={onMonthlyShortcut}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-orange-500"
                    aria-hidden
                  >
                    <path
                      d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7h8M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 11v6M9.5 14.5h5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  帮我生成本月小结
                </button>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendUserMessage(input);
                  }}
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="和小布说点什么…"
                    className="min-w-0 flex-1 rounded-2xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-sm text-stone-800 shadow-inner shadow-stone-100 outline-none ring-orange-200/50 transition placeholder:text-stone-400 focus:border-orange-300 focus:ring-2"
                    disabled={pending}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={pending || !input.trim()}
                    className="shrink-0 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-300/40 transition hover:brightness-105 disabled:opacity-40"
                  >
                    发送
                  </button>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
