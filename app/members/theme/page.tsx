import { redirect } from "next/navigation";

/** 旧路径兼容：主题已迁入设置 */
export default function ThemePageRedirect() {
  redirect("/members/settings/theme");
}
