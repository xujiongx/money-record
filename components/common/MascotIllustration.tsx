import { ILLUSTRATIONS, type IllustrationKey } from "@/lib/branding/illustrations";

/**
 * 插画尺寸：对齐设计稿卡片角标 / 空态 / 横幅比例
 * 角色原型：布布=public/bubu.png，一二=public/12.png
 */
const SIZE_CLASS = {
  /** 今日小结右侧点缀 */
  sm: "h-[5.25rem] w-auto max-w-[5.5rem]",
  /** 空状态主体 */
  md: "h-40 w-auto max-w-[14rem]",
  /** 登录头图 */
  lg: "h-48 w-auto max-w-[16rem]",
  /** 成员页横幅 */
  banner: "h-[7.5rem] w-auto max-w-[17rem]",
  /** 首页本月已花右下角 */
  peek: "h-[7rem] w-auto max-w-[9.5rem]",
  /** 记账页标题右侧点缀 */
  header: "h-[4.75rem] w-auto max-w-[5.25rem]",
} as const;

/** 场景插画 PNG（透明底） */
export function MascotIllustration({
  name,
  size = "md",
  className = "",
  alt = "",
}: {
  name: IllustrationKey;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  /** 装饰图可传空字符串 */
  alt?: string;
}) {
  return (
    <img
      src={ILLUSTRATIONS[name]}
      alt={alt}
      width={220}
      height={180}
      decoding="async"
      className={`pointer-events-none select-none object-contain ${SIZE_CLASS[size]} ${className}`}
    />
  );
}

/** 空状态：插画居中，文案在下（对齐设计稿） */
export function MascotEmpty({
  name = "emptyNoRecords",
  title,
  description,
  className = "",
}: {
  name?: IllustrationKey;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-8 text-center ${className}`}
    >
      <MascotIllustration name={name} size="md" alt="" />
      <p className="mt-3 text-sm font-bold text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-[15rem] text-xs leading-relaxed text-stone-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}
