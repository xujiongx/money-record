/** 基础模块 TTS：客户端语音合成引擎抽象 */

export type TtsSessionState = "idle" | "playing" | "paused";

export type TtsEngineCreateOptions = {
  /** 播放状态变化（引擎不依赖 React） */
  onSessionChange?: (state: TtsSessionState) => void;
};

/** 可插拔 TTS：入参为已处理好的纯文本（如由 stripMarkdownForSpeech 得到） */
export type TtsEngine = {
  readonly supported: boolean;
  speak(plainText: string): void;
  pause(): void;
  resume(): void;
  stop(): void;
};
