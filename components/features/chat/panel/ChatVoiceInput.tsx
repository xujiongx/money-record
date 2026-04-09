"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createAsrEngine } from "@/lib/foundation/asr/factory.client";
import type { AsrEngine } from "@/lib/foundation/asr/types";

const noopSubscribe = () => () => {};

function useAsrSupported(engine: AsrEngine): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => engine.supported,
    () => false,
  );
}

type ChatVoiceInputContextValue = {
  supported: boolean;
  listening: boolean;
  speechHint: string | null;
  busy: boolean;
  toggle: () => void;
};

const ChatVoiceInputContext = createContext<ChatVoiceInputContextValue | null>(
  null,
);

export type ChatVoiceInputProviderProps = {
  /** 与面板 loading / 请求中一致，为 true 时不可开始识别 */
  disabled: boolean;
  /** 开始识别前作为前缀保留在输入框 */
  input: string;
  /** 识别结果（含前缀合并后）写回 */
  onTranscript: (value: string) => void;
  /** 便于父级禁用输入框、发送按钮等 */
  onListeningChange?: (listening: boolean) => void;
  children: ReactNode;
};

/**
 * 语音输入：委托 `lib/foundation/asr`（默认 Web Speech API，zh-CN）。
 * 请在表单内放置 {@link ChatVoiceMicButton}，
 * 在输入行下方放置 {@link ChatVoiceStatusLine} 展示错误提示。
 */
export function ChatVoiceInputProvider({
  disabled,
  input,
  onTranscript,
  onListeningChange,
  children,
}: ChatVoiceInputProviderProps) {
  const engine = useMemo(() => createAsrEngine(), []);
  const supported = useAsrSupported(engine);
  const [listening, setListening] = useState(false);
  const [speechHint, setSpeechHint] = useState<string | null>(null);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    onListeningChange?.(listening);
  }, [listening, onListeningChange]);

  useEffect(() => {
    return () => {
      engine.abort();
    };
  }, [engine]);

  const stopListening = useCallback(() => {
    engine.stop();
  }, [engine]);

  const startListening = useCallback(() => {
    if (disabled) return;

    void engine.start({
      prefix: input.trimEnd() ? `${input.trimEnd()} ` : "",
      onTranscript,
      onHint: setSpeechHint,
      onListeningChange: setListening,
      isCancelled: () => disabledRef.current,
      lang: "zh-CN",
    });
  }, [disabled, engine, input, onTranscript]);

  const toggle = useCallback(() => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  }, [listening, startListening, stopListening]);

  const value = useMemo(
    () => ({
      supported,
      listening,
      speechHint,
      busy: disabled,
      toggle,
    }),
    [supported, listening, speechHint, disabled, toggle],
  );

  return (
    <ChatVoiceInputContext.Provider value={value}>
      {children}
    </ChatVoiceInputContext.Provider>
  );
}

function useChatVoiceInputContext(): ChatVoiceInputContextValue {
  const ctx = useContext(ChatVoiceInputContext);
  if (!ctx) {
    throw new Error(
      "ChatVoiceMicButton / ChatVoiceStatusLine must be used inside ChatVoiceInputProvider",
    );
  }
  return ctx;
}

/** 麦克风开关按钮（正方形圆角，与输入行等高区配套） */
export function ChatVoiceMicButton() {
  const { supported, listening, busy, toggle } = useChatVoiceInputContext();

  if (!supported) return null;

  return (
    <button
      type="button"
      disabled={busy}
      aria-pressed={listening}
      aria-label={listening ? "结束语音输入" : "语音输入"}
      title={listening ? "结束语音输入" : "语音输入（普通话）"}
      onClick={toggle}
      className={`flex size-[42px] shrink-0 items-center justify-center rounded-2xl border transition ${
        listening
          ? "border-orange-400 bg-orange-100 text-orange-700 shadow-inner ring-2 ring-orange-300/60"
          : "border-stone-200/90 bg-white text-stone-500 hover:border-orange-200 hover:text-orange-600"
      } disabled:opacity-40`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className={listening ? "text-orange-600" : undefined}
        aria-hidden
      >
        <path
          d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M8 11v1a4 4 0 008 0v-1M12 18v3M9 21h6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

/** 语音识别错误/提示文案，独占一行（放在输入行下方） */
export function ChatVoiceStatusLine() {
  const { speechHint } = useChatVoiceInputContext();
  if (!speechHint) return null;
  return (
    <p className="text-center text-xs text-amber-700">{speechHint}</p>
  );
}
