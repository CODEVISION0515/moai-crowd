import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Toaster } from "sonner";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import PWARegister from "@/components/PWARegister";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://moai-crowd.vercel.app";

// レイアウトで auth.getUser() を使うため動的レンダリング必須。
// try/catch で握りつぶすと Next.js の自動推論が静的に倒れるので明示する。
// これがないと /signup/confirm 等の useSearchParams ページが prerender エラーで落ちる。
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "MOAI｜ゆんたく・まなぶ・つくる — 沖縄発のAIプラットフォーム",
    template: "%s | MOAI",
  },
  description: "MOAIは、AIを学び・実践し・仕事にできるオールインワンのプラットフォーム。スクールで学び、コミュニティで繋がり、Crowdで仕事。発注者手数料0〜4%、受注者5〜15%、卒業生5%生涯。エスクロー決済で安心。",
  keywords: ["MOAI", "AIスクール", "クラウドソーシング", "コミュニティ", "副業", "フリーランス", "沖縄", "業務委託", "受注", "発注", "エスクロー"],
  authors: [{ name: "株式会社CODEVISION" }],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: APP_URL,
    siteName: "MOAI",
    title: "MOAI｜ゆんたく・まなぶ・つくる — 沖縄発のAIプラットフォーム",
    description: "AIを学び・実践し・仕事にできるオールインワン。スクール・コミュニティ・仕事マッチングまで一気通貫。発注者0〜4%・受注者5〜15%の業界最安級手数料。",
  },
  twitter: {
    card: "summary_large_image",
    title: "MOAI｜ゆんたく・まなぶ・つくる — 沖縄発のAIプラットフォーム",
    description: "AIを学び・実践し・仕事にできるオールインワン。スクール・コミュニティ・仕事マッチングまで。発注者0〜4%・受注者5〜15%。",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MOAI",
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
  // Supabase 接続失敗（env 未設定 / ネットワーク異常）でレイアウト全体が
  // 500 になるのを防ぐため、try/catch で握りつぶし、ヘッダーは未ログイン状態で描画する。
  let user: { id: string } | null = null;
  let profile: {
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
    active_mode: "worker" | "client" | null;
  } | null = null;

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData.user;
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, handle, avatar_url, active_mode")
        .eq("id", user.id)
        .maybeSingle();
      profile = data ?? null;
    }
  } catch (e) {
    console.error("[RootLayout] Supabase init/auth failed; rendering as anonymous", e);
  }

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
        <Header userId={user?.id ?? null} profile={profile} />
        <main className="flex-1">{children}</main>
        <BottomNav userId={user?.id ?? null} />
        <footer className="hidden md:block border-t border-moai-border bg-moai-cloud/50">
          <div className="container-app py-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-moai-primary">MOAI</span>
                <span className="text-[10px] text-moai-muted ml-1">ゆんたく・まなぶ・つくる — 沖縄発のAIプラットフォーム</span>
              </div>
              <nav aria-label="フッターナビゲーション" className="flex items-center gap-4 text-xs text-moai-muted">
                <Link href="/how-it-works" className="hover:text-moai-ink transition-colors">使い方</Link>
                <Link href="/legal/terms" className="hover:text-moai-ink transition-colors">利用規約</Link>
                <Link href="/legal/privacy" className="hover:text-moai-ink transition-colors">プライバシー</Link>
              </nav>
            </div>
            <div className="text-xs text-moai-muted text-center sm:text-right pt-2 border-t border-moai-border/50">
              運営: 株式会社CODEVISION · © {new Date().getFullYear()} MOAI
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
