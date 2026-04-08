"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  generateMonthlySummaryAction,
  mistralChatAction,
  type MistralChatMessage,
} from "@/app/actions/mistral-chat";

const OFFSET_STORAGE_KEY = "record-chatbot-offset-v1";

type UiMessage = { id: string; role: "user" | "assistant"; content: string };

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function RobotIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="5"
        y="7"
        width="14"
        height="12"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="9.5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="14.5" cy="12" r="1.2" fill="currentColor" />
      <path
        d="M9 15.5h6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M12 4v2M8 5l1 1.5M16 5l-1 1.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M7 19h10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function FloatingChatBot() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<{
    pointerId: number | null;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
    moved: boolean;
  } | null>(null);

  /* Portal 与 localStorage 需在 hydration 之后执行，避免 SSR 与首屏不一致 */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(OFFSET_STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { x?: number; y?: number };
        if (typeof p.x === "number" && typeof p.y === "number") {
          setOffset({ x: p.x, y: p.y });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function persistOffset(x: number, y: number) {
    try {
      localStorage.setItem(OFFSET_STORAGE_KEY, JSON.stringify({ x, y }));
    } catch {
      /* ignore */
    }
  }

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
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, pending]);

  const onFabPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
      moved: false,
    };
  };

  const onFabPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startClientX;
    const dy = e.clientY - d.startClientY;
    if (Math.hypot(dx, dy) > 8) d.moved = true;
    const nx = d.startOffsetX + dx;
    const ny = d.startOffsetY + dy;
    const max = 160;
    setOffset({
      x: Math.max(-max, Math.min(max, nx)),
      y: Math.max(-max, Math.min(max, ny)),
    });
  };

  const onFabPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    dragRef.current = null;
    if (!d.moved) {
      setOpen(true);
      setError(null);
    } else {
      setOffset((cur) => {
        persistOffset(cur.x, cur.y);
        return cur;
      });
    }
  };

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

  const shell = (
    <>
      {/* 与主内容同宽的固定层，机器人相对该栏定位 */}
      <div
        className="pointer-events-none fixed inset-0 z-[45] flex justify-center"
      >
        <div className="pointer-events-none relative h-full w-full max-w-md">
          <button
            type="button"
            aria-label="打开记账助手"
            className="pointer-events-auto absolute bottom-28 right-4 flex h-14 w-14 touch-none items-center justify-center rounded-2xl border border-white/50 bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-lg shadow-orange-500/35 transition active:scale-95"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
            onPointerDown={onFabPointerDown}
            onPointerMove={onFabPointerMove}
            onPointerUp={onFabPointerUp}
            onPointerCancel={onFabPointerUp}
          >
            <RobotIcon className="text-white" />
          </button>
        </div>
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chatbot-title"
            onClick={() => setOpen(false)}
          >
            <div
              className="flex max-h-[min(85dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 text-white">
                    <RobotIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2
                      id="chatbot-title"
                      className="text-sm font-semibold text-stone-800"
                    >
                      小布助手
                    </h2>
                    <p className="text-xs text-stone-500">记账问答 · 本月小结</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100"
                  onClick={() => setOpen(false)}
                >
                  关闭
                </button>
              </header>

              <div
                ref={listRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
              >
                {messages.length === 0 && (
                  <p className="text-center text-sm text-stone-400">
                    问我记账相关的问题，或点下方快捷按钮生成本月小结。
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                          : "bg-stone-100 text-stone-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {m.content}
                      </p>
                    </div>
                  </div>
                ))}
                {pending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-stone-100 px-3 py-2 text-sm text-stone-500">
                      正在思考…
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="px-4 text-center text-xs text-red-600">{error}</p>
              )}

              <div className="border-t border-stone-100 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
                <button
                  type="button"
                  disabled={pending}
                  className="mb-2 w-full rounded-2xl border border-orange-200 bg-orange-50 py-2 text-sm font-medium text-orange-800 disabled:opacity-50"
                  onClick={onMonthlyShortcut}
                >
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
                    placeholder="输入消息…"
                    className="min-w-0 flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-orange-300"
                    disabled={pending}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={pending || !input.trim()}
                    className="shrink-0 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
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

  if (!mounted) return null;
  return shell;
}
