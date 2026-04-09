export function speechRecognitionErrorMessage(code: string): string {
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
