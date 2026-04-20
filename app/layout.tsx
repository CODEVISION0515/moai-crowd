import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "MOAI Crowd | 業界最安手数料のAI特化クラウドソーシング",
  description: "AI特化のクラウドソーシング。発注者手数料4%（ローンチ6ヶ月は0%）、MOAI卒業生が受注で品質担保。沖縄発・全国展開中。",
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
                運営: CODEVISION株式会社 · © {new Date().getFullYear()} MOAI Crowd
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
