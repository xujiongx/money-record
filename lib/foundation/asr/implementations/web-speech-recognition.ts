/**
 * 浏览器 Web Speech API（SpeechRecognition / webkitSpeechRecognition）
 */

import type { AsrEngine, StartAsrOptions } from "@/lib/foundation/asr/types";
import { ensureMicrophoneAccess } from "@/lib/foundation/asr/utils/microphone";
import { prefersSingleUtteranceRecognition } from "@/lib/foundation/asr/utils/coarse-pointer";
import { speechRecognitionErrorMessage } from "@/lib/foundation/asr/utils/speech-error-message";

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

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** 供 UI 判断是否展示语音按钮（与引擎实例无关） */
export function getWebSpeechAsrSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export class WebSpeechRecognitionAsrEngine implements AsrEngine {
  private rec: SpeechRecognitionLike | null = null;
  private starting = false;

  get supported(): boolean {
    return typeof window !== "undefined" && getSpeechRecognitionCtor() !== null;
  }

  async start(opts: StartAsrOptions): Promise<void> {
    if (this.starting) return;
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || !this.supported) {
      return;
    }

    this.starting = true;
    try {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        opts.onHint(
          "语音输入需要安全连接：请使用 HTTPS 访问线上站点；若用手机通过「http://局域网 IP」打开开发环境，浏览器会禁止麦克风与语音识别。",
        );
        return;
      }

      this.abort();

      const lang = opts.lang ?? "zh-CN";
      const prefixTrim = opts.prefix.trimEnd();
      const prefix = prefixTrim ? `${prefixTrim} ` : "";

      opts.onHint(null);

      const micOk = await ensureMicrophoneAccess(opts.onHint);
      if (!micOk || opts.isCancelled?.()) {
        return;
      }

      const r = new Ctor();
      r.lang = lang;
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
        const merged = (prefix + full).replace(/\s+/g, " ").trimStart();
        opts.onTranscript(merged);
      };

      r.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === "aborted" || event.error === "no-speech") return;
        opts.onHint(speechRecognitionErrorMessage(event.error));
        opts.onListeningChange(false);
        this.rec = null;
      };

      r.onend = () => {
        opts.onListeningChange(false);
        this.rec = null;
      };

      if (opts.isCancelled?.()) {
        return;
      }

      this.rec = r;
      r.start();
      opts.onListeningChange(true);
      opts.onHint(null);
    } catch {
      opts.onHint("无法启动语音识别");
      opts.onListeningChange(false);
    } finally {
      this.starting = false;
    }
  }

  stop(): void {
    this.rec?.stop();
  }

  abort(): void {
    this.rec?.abort();
    this.rec = null;
  }
}
