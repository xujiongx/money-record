"use client";

import { NoopAsrEngine } from "@/lib/foundation/asr/implementations/noop";
import { WebSpeechRecognitionAsrEngine } from "@/lib/foundation/asr/implementations/web-speech-recognition";
import type { AsrEngine } from "@/lib/foundation/asr/types";

/**
 * 按 `NEXT_PUBLIC_ASR_PROVIDER` 选择实现（默认 `web-speech`）。
 * 仅客户端组件引用本文件。
 */
export function createAsrEngine(): AsrEngine {
  const provider = (
    process.env.NEXT_PUBLIC_ASR_PROVIDER ?? "web-speech"
  ).toLowerCase();

  switch (provider) {
    case "noop":
      return new NoopAsrEngine();
    case "web-speech":
    default:
      return new WebSpeechRecognitionAsrEngine();
  }
}
