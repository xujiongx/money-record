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

// —— Web Speech 收窄类型（部分 TS lib 未包含） ——

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionResultEventLike = {
  results: {
    length: number;
    item: (index: number) => {
      length: number;
      item: (index: number) => { transcript: string };
    };
  };
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** 手机、平板等触控环境：连续识别易触发兼容问题，改为单次会话更稳 */
function prefersSingleUtteranceRecognition(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) return true;
  if (typeof window === "undefined") return false;
  return Boolean(window.matchMedia?.("(pointer: coarse)").matches);
}

/**
 * 先请求麦克风（与语音识别同属「麦克风」权限），移动端/微信内更易弹出明确授权框。
 * 拿到轨道后立即 stop，避免占用设备；权限仍保留给后续 SpeechRecognition。
 */
async function ensureMicrophoneAccess(
  setHint: (msg: string | null) => void,
): Promise<boolean> {
  if (typeof navigator === "undefined") return true;
  const md = navigator.mediaDevices;
  if (!md?.getUserMedia) {
    return true;
  }
  try {
    const stream = await md.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch (e) {
    const err = e as DOMException;
    const name = err?.name ?? "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      setHint(
        "麦克风权限被拒绝：请在浏览器或系统设置中允许本站使用麦克风，再点语音按钮重试",
      );
    } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      setHint("未检测到可用麦克风，请连接麦克风后重试");
    } else if (name === "NotReadableError" || name === "TrackStartError") {
      setHint("麦克风被占用或无法打开，请关闭其他录音/通话应用后重试");
    } else if (name === "OverconstrainedError") {
      setHint("当前设备无法满足录音要求，请改用文字输入");
    } else if (name === "SecurityError") {
      setHint(
        "浏览器因安全策略拒绝录音：请使用 HTTPS 或系统浏览器打开（微信内置页可能无法授权）",
      );
    } else {
      setHint("无法访问麦克风，请检查权限与浏览器设置后重试");
    }
    return false;
  }
}

function speechRecognitionErrorMessage(code: string): string {
  const map: Record<string, string> = {
    "not-allowed":
      "麦克风权限被拒绝，请在系统设置里允许浏览器使用麦克风后重试",
    "audio-capture":
      "无法捕获麦克风（可能被占用或未授权），请检查权限或拔掉耳机再试",
    network:
      "识别服务需要联网（多为云端识别），请检查网络或稍后重试",
    "service-not-allowed":
      "当前内置浏览器不支持网页语音识别，请用系统 Chrome / Safari 打开本站",
    "language-not-supported": "当前环境不支持所选语言，请改用文字输入",
    start: "识别引擎未能启动，请稍后重试或改用文字输入",
    "bad-grammar": "语音识别异常，请改用文字输入",
  };
  return map[code] ?? "语音识别失败，请改用文字输入";
}

const noopSubscribe = () => () => {};

function useVoiceInputSupported(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => getSpeechRecognitionCtor() !== null,
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
 * 语音输入：Web Speech API（zh-CN）。请在表单内放置 {@link ChatVoiceMicButton}，
 * 在输入行下方放置 {@link ChatVoiceStatusLine} 展示错误提示。
 */
export function ChatVoiceInputProvider({
  disabled,
  input,
  onTranscript,
  onListeningChange,
  children,
}: ChatVoiceInputProviderProps) {
  const supported = useVoiceInputSupported();
  const [listening, setListening] = useState(false);
  const [speechHint, setSpeechHint] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const prefixRef = useRef("");
  const warmupRef = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    onListeningChange?.(listening);
  }, [listening, onListeningChange]);

  useEffect(() => {
    return () => {
      recRef.current?.abort();
      recRef.current = null;
    };
  }, []);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || disabled || warmupRef.current) return;

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setSpeechHint(
        "语音输入需要安全连接：请使用 HTTPS 访问线上站点；若用手机通过「http://局域网 IP」打开开发环境，浏览器会禁止麦克风与语音识别。",
      );
      return;
    }

    recRef.current?.abort();
    prefixRef.current = input.trimEnd() ? `${input.trimEnd()} ` : "";

    warmupRef.current = true;
    setSpeechHint(null);

    void (async () => {
      try {
        const micOk = await ensureMicrophoneAccess(setSpeechHint);
        if (!micOk || disabledRef.current) {
          return;
        }

        const r = new Ctor();
        r.lang = "zh-CN";
        const mobileLike = prefersSingleUtteranceRecognition();
        r.continuous = !mobileLike;
        r.interimResults = true;

        r.onresult = (event: SpeechRecognitionResultEventLike) => {
          let full = "";
          const { results } = event;
          for (let i = 0; i < results.length; i++) {
            const res = results.item(i);
            if (res.length > 0) {
              full += res.item(0).transcript;
            }
          }
          const merged = (prefixRef.current + full)
            .replace(/\s+/g, " ")
            .trimStart();
          onTranscript(merged);
        };

        r.onerror = (event: SpeechRecognitionErrorEventLike) => {
          if (event.error === "aborted" || event.error === "no-speech") return;
          setSpeechHint(speechRecognitionErrorMessage(event.error));
          setListening(false);
          recRef.current = null;
        };

        r.onend = () => {
          setListening(false);
          recRef.current = null;
        };

        if (disabledRef.current) {
          return;
        }

        recRef.current = r;
        r.start();
        setListening(true);
        setSpeechHint(null);
      } catch {
        setSpeechHint("无法启动语音识别");
        setListening(false);
      } finally {
        warmupRef.current = false;
      }
    })();
  }, [disabled, input, onTranscript]);

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
