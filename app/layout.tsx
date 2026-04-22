import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import PWARegister from "@/components/PWARegister";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://moai-crowd.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "MOAI Crowd｜業界最安手数料のAI特化クラウドソーシング｜沖縄発",
    template: "%s | MOAI Crowd",
  },
  description: "AI特化のクラウドソーシング。発注者手数料はローンチ6ヶ月0%（以降4%）、受注者5〜15%で業界最安級。MOAIスクール卒業生は生涯5%固定。エスクロー決済で安心、AI機能で作業時短。沖縄発・全国展開中。",
  keywords: ["クラウドソーシング", "AI", "副業", "フリーランス", "沖縄", "業務委託", "MOAI", "受注", "発注", "エスクロー", "AI副業"],
  authors: [{ name: "株式会社CODEVISION" }],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: APP_URL,
    siteName: "MOAI Crowd",
    title: "MOAI Crowd｜業界最安手数料のAI特化クラウドソーシング｜沖縄発",
    description: "AI特化のクラウドソーシング。発注者手数料はローンチ6ヶ月0%（以降4%）、受注者5〜15%で業界最安級。MOAIスクール卒業生は生涯5%固定。エスクロー決済で安心、AI機能で作業時短。",
  },
  twitter: {
    card: "summary_large_image",
    title: "MOAI Crowd｜業界最安手数料のAI特化クラウドソーシング｜沖縄発",
    description: "AI特化クラウドソーシング。発注者0〜4%/受注者5〜15%/卒業生5%生涯。エスクロー決済・AI機能搭載・沖縄発で全国展開中。",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MOAI Crowd",
  },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col bg-white">
        <PWARegister />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            className: "!font-sans",
            duration: 4000,
          }}
        />
        <Header userId={user?.id ?? null} />
        <main className="flex-1">{children}</main>
        <BottomNav userId={user?.id ?? null} />
        <footer className="hidden md:block border-t border-moai-border bg-moai-cloud/50">
          <div className="container-app py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-moai-primary">MOAI</span>
                <span className="text-xs text-moai-muted">Crowd</span>
                <span className="text-[10px] text-moai-muted ml-2">業界最安手数料のAI特化クラウドソーシング</span>
              </div>
              <div className="text-xs text-moai-muted">
                運営: 株式会社CODEVISION · © {new Date().getFullYear()} MOAI Crowd
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
