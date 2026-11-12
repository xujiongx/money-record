import type { Metadata, Viewport } from "next";
import { Geist_Mono, Noto_Sans_SC, Nunito } from "next/font/google";
import { MobileShell } from "@/components/common/MobileShell";
import { ThemeBootstrap } from "@/components/common/ThemeBootstrap";
import { SsgoiProvider } from "@/app/ssgoi-provider";
import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APP_SHORT_NAME,
} from "@/lib/app-branding";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const notoSansSc = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html
      lang="zh-CN"
      data-theme="warm"
      className={`${nunito.variable} ${notoSansSc.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <ThemeBootstrap />
        <div className="paper-texture relative z-0 mx-auto min-h-dvh w-full min-w-0 max-w-md overflow-x-clip shadow-sm shadow-stone-900/5">
          <SsgoiProvider>
            <MobileShell>{children}</MobileShell>
          </SsgoiProvider>
        </div>
      </body>
    </html>
  );
}
