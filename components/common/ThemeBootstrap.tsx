import Script from "next/script";
import { THEME_STORAGE_KEY } from "@/lib/theme/themes";

/**
 * 在 hydration 前根据 localStorage 写入 data-theme，减少主题闪烁。
 */
export function ThemeBootstrap() {
  const script = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var v=localStorage.getItem(k);var ok=["warm","clay","moss","ocean","grape","ink"];var id=ok.indexOf(v)>=0?v:"warm";document.documentElement.setAttribute("data-theme",id);var colors={warm:"#e85d04",clay:"#c45c26",moss:"#4f7f5b",ocean:"#2563eb",grape:"#7c3aed",ink:"#334155"};var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",colors[id]||colors.warm);}catch(e){}})();`;

  return (
    <Script
      id="theme-bootstrap"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
