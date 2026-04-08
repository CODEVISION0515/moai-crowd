import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import NotificationBell from "@/components/NotificationBell";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "MOAI Crowd | 仲間と創る、仕事のマッチング",
  description: "MOAIコミュニティ発のクラウドソーシング。仕事を頼みたい人と、力を貸したい人を繋ぐ。",
  manifest: "/manifest.json",
  themeColor: "#0f766e",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MOAI Crowd",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col">
        <PWARegister />
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-bold text-moai-primary">
              MOAI <span className="text-moai-accent">Crowd</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/jobs" className="hover:text-moai-primary">案件を探す</Link>
              <Link href="/workers" className="hover:text-moai-primary">受注者を探す</Link>
              {user ? (
                <>
                  <Link href="/jobs/new" className="hover:text-moai-primary">案件を依頼</Link>
                  <Link href="/messages" className="hover:text-moai-primary">メッセージ</Link>
                  <Link href="/dashboard" className="hover:text-moai-primary">ダッシュボード</Link>
                  <NotificationBell userId={user.id} />
                  <SignOutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-moai-primary">ログイン</Link>
                  <Link href="/signup" className="btn-primary">新規登録</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} MOAI Crowd by CODEVISION
        </footer>
      </body>
    </html>
  );
}
