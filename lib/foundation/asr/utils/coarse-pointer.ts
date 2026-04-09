/** 手机、平板等触控环境：连续识别易触发兼容问题，改为单次会话更稳 */
export function prefersSingleUtteranceRecognition(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) return true;
  if (typeof window === "undefined") return false;
  return Boolean(window.matchMedia?.("(pointer: coarse)").matches);
}
