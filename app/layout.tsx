import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MobileShell } from "@/components/MobileShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "家庭记账",
  description: "布布和一二的家庭温暖小账本",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fb923c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-dvh antialiased">
        <div className="relative mx-auto min-h-dvh w-full max-w-md bg-[#fff7f5] shadow-xl shadow-orange-950/10">
          <MobileShell>{children}</MobileShell>
        </div>
      </body>
    </html>
  );
}
