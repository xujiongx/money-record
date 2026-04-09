import type {
  TtsEngine,
  TtsEngineCreateOptions,
  TtsSessionState,
} from "@/lib/foundation/tts/types";

type WebSpeechOptions = TtsEngineCreateOptions & {
  lang?: string;
  rate?: number;
};

/** 浏览器 Web Speech API（SpeechSynthesis） */
export class WebSpeechSynthesisTts implements TtsEngine {
  private readonly onSessionChange?: (state: TtsSessionState) => void;
  private readonly lang: string;
  private readonly rate: number;

  constructor(options?: WebSpeechOptions) {
    this.onSessionChange = options?.onSessionChange;
    this.lang = options?.lang ?? "zh-CN";
    this.rate = options?.rate ?? 0.95;
  }

  get supported(): boolean {
    return typeof window !== "undefined" && !!window.speechSynthesis;
  }

  private emit(state: TtsSessionState): void {
    this.onSessionChange?.(state);
  }

  speak(plainText: string): void {
    if (!this.supported) {
      this.emit("idle");
      return;
    }
    const trimmed = plainText.trim();
    if (!trimmed) {
      this.emit("idle");
      return;
    }
    window.speechSynthesis.cancel();
    this.emit("idle");
    const u = new SpeechSynthesisUtterance(trimmed);
    u.lang = this.lang;
    u.rate = this.rate;
    u.onstart = () => this.emit("playing");
    u.onend = () => this.emit("idle");
    u.onerror = () => this.emit("idle");
    window.speechSynthesis.speak(u);
  }

  pause(): void {
    if (!this.supported) return;
    if (!window.speechSynthesis.speaking) return;
    window.speechSynthesis.pause();
    this.emit("paused");
  }

  resume(): void {
    if (!this.supported) return;
    window.speechSynthesis.resume();
    this.emit("playing");
  }

  stop(): void {
    if (!this.supported) return;
    window.speechSynthesis.cancel();
    this.emit("idle");
  }
}
