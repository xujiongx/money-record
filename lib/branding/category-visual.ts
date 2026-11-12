import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Bus,
  Clapperboard,
  Dumbbell,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  MoreHorizontal,
  Plane,
  Receipt,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";

export type CategoryVisual = {
  icon: LucideIcon;
  /** squircle 背景 */
  bg: string;
  /** 图标色 */
  fg: string;
};

const FALLBACK: CategoryVisual = {
  icon: MoreHorizontal,
  bg: "#F3EDE6",
  fg: "#A69D94",
};

/** 设计稿分类色块：圆角方底 + 彩色图标 */
const BY_NAME: Record<string, CategoryVisual> = {
  餐饮: { icon: UtensilsCrossed, bg: "#FFE4D1", fg: "#F47732" },
  购物: { icon: ShoppingBag, bg: "#FFE0E6", fg: "#FF4D4F" },
  住宿: { icon: Home, bg: "#DFF3E6", fg: "#52C41A" },
  交通: { icon: Bus, bg: "#DCECFF", fg: "#67B7FF" },
  娱乐: { icon: Clapperboard, bg: "#EDE4FF", fg: "#9B7BFF" },
  还款: { icon: Receipt, bg: "#FFF0D6", fg: "#FFB347" },
  旅行: { icon: Plane, bg: "#D8F3FF", fg: "#3BAFDA" },
  教育: { icon: GraduationCap, bg: "#E4F0FF", fg: "#5B8DEF" },
  医疗: { icon: HeartPulse, bg: "#FFE4EA", fg: "#FF4D4F" },
  运动: { icon: Dumbbell, bg: "#E8EEF5", fg: "#7A8CA3" },
  其他: FALLBACK,
  工资: { icon: Wallet, bg: "#DFF3E6", fg: "#52C41A" },
  奖金: { icon: Gift, bg: "#FFE4D1", fg: "#F47732" },
  投资: { icon: TrendingUp, bg: "#DCECFF", fg: "#67B7FF" },
  红包: { icon: Banknote, bg: "#FFE0E6", fg: "#FF4D4F" },
};

export function categoryVisual(name: string): CategoryVisual {
  return BY_NAME[name] ?? FALLBACK;
}
