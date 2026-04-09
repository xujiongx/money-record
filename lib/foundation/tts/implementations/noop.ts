import type { TtsEngine } from "@/lib/foundation/tts/types";

/** 显式降级：不合成语音，`supported` 为 false */
export class NoopTtsEngine implements TtsEngine {
  readonly supported = false;

  speak(_plainText: string): void {}

  pause(): void {}

  resume(): void {}

  stop(): void {}
}
