/**
 * 先请求麦克风（与语音识别同属「麦克风」权限），移动端/微信内更易弹出明确授权框。
 * 拿到轨道后立即 stop，避免占用设备。
 */
export async function ensureMicrophoneAccess(
  setHint: (msg: string | null) => void,
): Promise<boolean> {
  if (typeof navigator === "undefined") return true;
  const md = navigator.mediaDevices;
  if (!md?.getUserMedia) {
    return true;
  }
  try {
    const stream = await md.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch (e) {
    const err = e as DOMException;
    const name = err?.name ?? "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      setHint(
        "麦克风权限被拒绝：请在浏览器或系统设置中允许本站使用麦克风，再点语音按钮重试",
      );
    } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      setHint("未检测到可用麦克风，请连接麦克风后重试");
    } else if (name === "NotReadableError" || name === "TrackStartError") {
      setHint("麦克风被占用或无法打开，请关闭其他录音/通话应用后重试");
    } else if (name === "OverconstrainedError") {
      setHint("当前设备无法满足录音要求，请改用文字输入");
    } else if (name === "SecurityError") {
      setHint(
        "浏览器因安全策略拒绝录音：请使用 HTTPS 或系统浏览器打开（微信内置页可能无法授权）",
      );
    } else {
      setHint("无法访问麦克风，请检查权限与浏览器设置后重试");
    }
    return false;
  }
}
