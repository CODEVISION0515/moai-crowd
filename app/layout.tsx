import type { Metadata, Viewport } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "MOAI Crowd | 仲間と創る、仕事のマッチング",
  description: "MOAIコミュニティ発のクラウドソーシング。仕事を頼みたい人と、力を貸したい人を、ゆんたくで繋ぐ。",
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
        <Header userId={user?.id ?? null} />
        <main className="flex-1">{children}</main>
        <BottomNav userId={user?.id ?? null} />
        <footer className="hidden md:block border-t border-moai-border bg-moai-cloud/50">
          <div className="container-app py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-moai-primary">MOAI</span>
                <span className="text-xs text-moai-muted">Crowd</span>
              </div>
              <div className="text-xs text-moai-muted">
                © {new Date().getFullYear()} MOAI Crowd by CODEVISION
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
