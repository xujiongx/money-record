/** 基础模块 ASR：客户端语音识别引擎抽象 */

export type StartAsrOptions = {
  /** 写入输入框时置于识别结果前的前缀（通常当前 input trim + 空格） */
  prefix: string;
  /** 合并前缀后的全文 */
  onTranscript: (value: string) => void;
  onHint: (msg: string | null) => void;
  onListeningChange: (listening: boolean) => void;
  /** 在异步步骤（如麦克风授权）之后调用；为 true 则不再启动识别 */
  isCancelled?: () => boolean;
  /** BCP 47，默认 zh-CN */
  lang?: string;
};

/** 可插拔语音识别（浏览器或后续云端 ASR） */
export type AsrEngine = {
  readonly supported: boolean;
  start(opts: StartAsrOptions): Promise<void>;
  stop(): void;
  abort(): void;
};
