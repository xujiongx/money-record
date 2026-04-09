"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createTtsEngine } from "@/lib/foundation/tts/factory.client";
import type { TtsSessionState } from "@/lib/foundation/tts/types";
import { stripMarkdownForSpeech } from "@/lib/foundation/tts/text/strip-markdown-for-speech";

const STORAGE_KEY = "xiaobu_chat_tts_enabled";

function readStoredEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export type ChatAssistantTtsSession = TtsSessionState;

export function useChatAssistantTts(options: { panelOpen: boolean }) {
  const { panelOpen } = options;
  const [enabled, setEnabledState] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<TtsSessionState>("idle");

  const engine = useMemo(
    () =>
      createTtsEngine({
        onSessionChange: setSession,
      }),
    [],
  );

  useEffect(() => {
    queueMicrotask(() => {
      setHydrated(true);
      setEnabledState(readStoredEnabled());
    });
  }, []);

  const setEnabled = useCallback(
    (next: boolean) => {
      setEnabledState(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (!next) {
        engine.stop();
      }
    },
    [engine],
  );

  const stop = useCallback(() => {
    engine.stop();
  }, [engine]);

  const speak = useCallback(
    (raw: string) => {
      if (!enabled || !engine.supported) {
        return;
      }
      const plain = stripMarkdownForSpeech(raw);
      engine.speak(plain);
    },
    [enabled, engine],
  );

  const pause = useCallback(() => {
    engine.pause();
  }, [engine]);

  const resume = useCallback(() => {
    engine.resume();
  }, [engine]);

  useEffect(() => {
    if (!panelOpen) {
      stop();
    }
  }, [panelOpen, stop]);

  const supported = hydrated && engine.supported;

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
