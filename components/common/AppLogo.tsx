/**
 * 站标：与 `app/icon.svg` 同源（浏览器标签、favicon、iOS 主屏幕均使用该文件）。
 */
export function AppLogo({
  size = 56,
  className = "",
  alt = "家庭记账",
}: {
  size?: number;
  className?: string;
  /** 装饰性场景可传空字符串 */
  alt?: string;
}) {
  return (
    <img
      src="/icon.svg"
      alt={alt}
      width={size}
      height={size}
      decoding="async"
      className={`shrink-0 select-none ${className}`}
    />
  );
}
