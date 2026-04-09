"use client";

import { NoopTtsEngine } from "@/lib/foundation/tts/implementations/noop";
import { WebSpeechSynthesisTts } from "@/lib/foundation/tts/implementations/web-speech-synthesis";
import type { TtsEngine, TtsEngineCreateOptions } from "@/lib/foundation/tts/types";

/**
 * 按 `NEXT_PUBLIC_TTS_PROVIDER` 选择实现（默认 `web-speech`）。
 * 仅客户端组件引用本文件。
 */
export function createTtsEngine(options?: TtsEngineCreateOptions): TtsEngine {
  const provider = (
    process.env.NEXT_PUBLIC_TTS_PROVIDER ?? "web-speech"
  ).toLowerCase();

  switch (provider) {
    case "noop":
      return new NoopTtsEngine();
    case "web-speech":
    default:
      return new WebSpeechSynthesisTts(options);
  }
}
