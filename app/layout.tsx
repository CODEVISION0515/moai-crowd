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
    default: "MOAI Crowd｜AIに強いクラウドソーシング — 業界最安級の手数料",
    template: "%s | MOAI Crowd",
  },
  description: "MOAI Crowdは、AIに強いワーカーが集まるクラウドソーシング。業界最安級の手数料(発注者4%・受注者5〜15%)、エスクロー決済、AIによる案件作成・提案サポート。沖縄発、全国対応。",
  keywords: ["クラウドソーシング", "AI", "副業", "フリーランス", "業務委託", "受注", "発注", "エスクロー", "沖縄", "MOAI", "ランサーズ", "クラウドワークス"],
  authors: [{ name: "株式会社CODEVISION" }],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: APP_URL,
    siteName: "MOAI Crowd",
    title: "MOAI Crowd｜AIに強いクラウドソーシング",
    description: "AIに強いワーカーと依頼主をつなぐ、業界最安級のクラウドソーシング。発注者4%・受注者5〜15%。エスクロー決済で安心。",
  },
  twitter: {
    card: "summary_large_image",
    title: "MOAI Crowd｜AIに強いクラウドソーシング",
    description: "AIに強いワーカーと依頼主をつなぐ、業界最安級のクラウドソーシング。発注者4%・受注者5〜15%。エスクロー決済で安心。",
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

  let profile: {
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
    active_mode: "worker" | "client" | null;
  } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, handle, avatar_url, active_mode")
      .eq("id", user.id)
      .maybeSingle();
    profile = data ?? null;
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
        <footer className="hidden md:block border-t border-moai-border bg-moai-cloud/40 mt-16">
          <div className="container-wide py-12">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
              {/* Brand block */}
              <div className="col-span-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-moai-primary tracking-tight">MOAI</span>
                  <span className="text-sm font-semibold text-moai-ink/80">Crowd</span>
                </div>
                <p className="mt-3 text-xs text-moai-muted leading-relaxed max-w-xs">
                  AIに強いワーカーと依頼主をつなぐ、業界最安級のクラウドソーシング。
                  沖縄発・全国対応。
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-moai-muted">
                  <span className="badge-accent">手数料4%〜</span>
                  <span className="badge">エスクロー決済</span>
                </div>
              </div>

              {/* Find work */}
              <div>
                <h4 className="footer-col-title">仕事を探す</h4>
                <a href="/jobs" className="footer-col-link">案件一覧</a>
                <a href="/jobs?category=web" className="footer-col-link">Web制作</a>
                <a href="/jobs?category=design" className="footer-col-link">デザイン</a>
                <a href="/jobs?category=ai" className="footer-col-link">AI / 自動化</a>
                <a href="/jobs?category=writing" className="footer-col-link">ライティング</a>
              </div>

              {/* Hire */}
              <div>
                <h4 className="footer-col-title">仕事を依頼する</h4>
                <a href="/jobs/new" className="footer-col-link">案件を投稿</a>
                <a href="/workers" className="footer-col-link">ワーカーを探す</a>
                <a href="/pricing" className="footer-col-link">料金・手数料</a>
                <a href="/how-it-works" className="footer-col-link">使い方ガイド</a>
              </div>

              {/* About / related */}
              <div>
                <h4 className="footer-col-title">運営・関連</h4>
                <a href="/school" className="footer-col-link">MOAIスクール</a>
                <a href="/community" className="footer-col-link">コミュニティ</a>
                <a href="/legal/terms" className="footer-col-link">利用規約</a>
                <a href="/legal/privacy" className="footer-col-link">プライバシー</a>
                <a href="/legal/tokushoho" className="footer-col-link">特定商取引法</a>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-moai-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-moai-muted">
              <span>運営: 株式会社CODEVISION（沖縄県本部町）</span>
              <span>© {new Date().getFullYear()} MOAI Crowd. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
