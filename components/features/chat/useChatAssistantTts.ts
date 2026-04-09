"use client";

import { useCallback, useEffect, useState } from "react";
import { stripMarkdownForSpeech } from "@/components/features/chat/assistant-tts";

const STORAGE_KEY = "xiaobu_chat_tts_enabled";

function readStoredEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export type ChatAssistantTtsSession = "idle" | "playing" | "paused";

export function useChatAssistantTts(options: { panelOpen: boolean }) {
  const { panelOpen } = options;
  const [enabled, setEnabledState] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<ChatAssistantTtsSession>("idle");

  useEffect(() => {
    setHydrated(true);
    setEnabledState(readStoredEnabled());
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (!next && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSession("idle");
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSession("idle");
  }, []);

  const speak = useCallback(
    (raw: string) => {
      if (!enabled || typeof window === "undefined" || !window.speechSynthesis) {
        return;
      }
      const plain = stripMarkdownForSpeech(raw);
      if (!plain) {
        setSession("idle");
        return;
      }
      window.speechSynthesis.cancel();
      setSession("idle");
      const u = new SpeechSynthesisUtterance(plain);
      u.lang = "zh-CN";
      u.rate = 0.95;
      u.onstart = () => setSession("playing");
      u.onend = () => setSession("idle");
      u.onerror = () => setSession("idle");
      window.speechSynthesis.speak(u);
    },
    [enabled],
  );

  const pause = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (!window.speechSynthesis.speaking) return;
    window.speechSynthesis.pause();
    setSession("paused");
  }, []);

  const resume = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.resume();
    setSession("playing");
  }, []);

  useEffect(() => {
    if (!panelOpen) {
      stop();
    }
  }, [panelOpen, stop]);

  const supported =
    hydrated && typeof window !== "undefined" && !!window.speechSynthesis;

  return {
    enabled,
    setEnabled,
    speak,
    pause,
    resume,
    stop,
    session,
    supported,
  };
}
