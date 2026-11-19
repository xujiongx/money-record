import type { Metadata, Viewport } from "next";
import { AppChrome } from "@/components/common/AppChrome";
import { ThemeBootstrap } from "@/components/common/ThemeBootstrap";
import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APP_SHORT_NAME,
} from "@/lib/app-branding";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_SHORT_NAME,
  /** favicon / PWA / iOS 主屏幕均使用 `app/icon.svg`（发布路径 `/icon.svg`） */
  icons: {
    /** favicon 仍由 `app/icon.svg` 约定生成；此处只补 iOS 主屏幕，与站标同源 */
    apple: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
  },
  appleWebApp: {
    capable: true,
    title: APP_DISPLAY_NAME,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f47732",
  colorScheme: "light",
  /** 与刘海屏安全区配合，避免独立 WebView 里背景露白 */
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-theme="warm" className="h-full" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <ThemeBootstrap />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
