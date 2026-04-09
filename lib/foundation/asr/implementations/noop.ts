import type { AsrEngine, StartAsrOptions } from "@/lib/foundation/asr/types";

export class NoopAsrEngine implements AsrEngine {
  readonly supported = false;

  async start(_opts: StartAsrOptions): Promise<void> {}

  stop(): void {}

  abort(): void {}
}
