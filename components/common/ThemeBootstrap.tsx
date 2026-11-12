import Script from "next/script";
import { THEME_STORAGE_KEY } from "@/lib/theme/themes";

/**
 * 在 hydration 前根据 localStorage 写入 data-theme，减少主题闪烁。
 */
export function ThemeBootstrap() {
  const script = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var v=localStorage.getItem(k);var ok=["warm","clay","moss","ocean","grape","ink"];var id=ok.indexOf(v)>=0?v:"warm";document.documentElement.setAttribute("data-theme",id);var colors={warm:"#f47732",clay:"#c45c26",moss:"#5f8f6b",ocean:"#3b82f6",grape:"#a855f7",ink:"#334155"};var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",colors[id]||colors.warm);}catch(e){}})();`;

  return (
    <Script
      id="theme-bootstrap"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
