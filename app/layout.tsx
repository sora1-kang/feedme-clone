import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "URL을 Markdown으로",
  description: "웹 페이지 주소를 붙여넣으면 본문만 Markdown으로 뽑아 드립니다.",
};

// 저장된 선택이 없으면 시스템 설정을 따른다. 첫 페인트 전에 실행해 깜빡임을 막는다.
const THEME_INIT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        {/* 서버 HTML에서 이미 실행되므로, 클라이언트 렌더링에서는 실행되지 않는 타입으로 바꿔 React 19의 script 경고를 피한다. */}
        <script
          suppressHydrationWarning
          type={typeof window === "undefined" ? undefined : "application/json"}
          dangerouslySetInnerHTML={{ __html: THEME_INIT }}
        />
        {children}
      </body>
    </html>
  );
}
