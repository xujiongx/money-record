/**
 * Web App /「添加到主屏幕」展示名称与说明。
 *
 * - 名称：改下面三个常量即可；`app/layout.tsx` 与 `app/manifest.ts` 已引用。
 * - 图标：只维护 **`app/icon.svg`** 即可；`app/layout.tsx` 的 `metadata.icons` 与 **`app/manifest.ts`** 均指向 `/icon.svg`（含 iOS `apple-touch-icon`）。换图后若主屏幕仍旧，请删图标重新添加。
 */
export const APP_DISPLAY_NAME = "小账本";

/** 主屏幕图标下短名（宜 2～4 字） */
export const APP_SHORT_NAME = "小账本";

export const APP_DESCRIPTION = "布布和一二的家庭温暖小账本";
