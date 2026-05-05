"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import SignOutButton from "@/components/SignOutButton";
import NotificationBell from "@/components/NotificationBell";
import CreditsBadge from "@/components/CreditsBadge";
import UserMenu from "@/components/UserMenu";

const PUBLIC_LINKS = [
  { href: "/jobs", label: "仕事を探す" },
  { href: "/workers", label: "ワーカーを探す" },
  { href: "/pricing", label: "料金" },
  { href: "/how-it-works", label: "使い方" },
];

const SECONDARY_LINKS = [
  { href: "/school", label: "MOAIスクール" },
  { href: "/community", label: "コミュニティ" },
];

const AUTH_LINKS = [
  { href: "/dashboard", label: "マイページ", icon: "📊" },
  { href: "/jobs/new", label: "依頼する", icon: "📝" },
  { href: "/bookmarks", label: "保存済み", icon: "🔖" },
  { href: "/messages", label: "メッセージ", icon: "💬" },
  { href: "/credits", label: "クレジット", icon: "💎" },
  { href: "/invite", label: "紹介して稼ぐ", icon: "🎁" },
  { href: "/invoices", label: "請求書", icon: "📄" },
  { href: "/earnings", label: "収益", icon: "💰" },
  { href: "/leaderboard", label: "ランキング", icon: "🏆" },
];

type HeaderProfile = {
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  active_mode?: "worker" | "client" | null;
};

const AUTH_PATHS = ["/login", "/signup", "/signup/confirm", "/forgot-password", "/auth/reset-password"];

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function Logo() {
  return (
    <Link href="/" aria-label="MOAI Crowd ホーム" className="flex items-baseline gap-1.5 group shrink-0">
      <span className="text-lg font-bold text-moai-primary transition-colors group-hover:text-moai-primary-800 tracking-tight">
        MOAI
      </span>
      <span className="text-sm font-semibold text-moai-ink/80 group-hover:text-moai-ink transition-colors">
        Crowd
      </span>
    </Link>
  );
}

export default function Header({
  userId,
  profile,
}: {
  userId: string | null;
  profile?: HeaderProfile | null;
}) {
  const activeMode = (profile?.active_mode ?? "worker") as "worker" | "client";
  const pathname = usePathname();

  // 認証ページではロゴだけのミニマルヘッダーに
  if (isAuthPath(pathname)) {
    return (
      <header className="sticky top-0 z-40 bg-white border-b border-moai-border">
        <div className="container-app flex items-center h-[var(--header-h)]">
          <Logo />
        </div>
      </header>
    );
  }
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled
            ? "bg-white/85 backdrop-blur-md shadow-soft border-b border-transparent"
            : "bg-white border-b border-moai-border"
        }`}
      >
        <div className="container-wide flex items-center justify-between h-[var(--header-h)] gap-4">
          {/* Logo */}
          <Logo />

          {/* Desktop nav: 全ユーザー共通でクラウドソーシング動線を表示 */}
          <nav aria-label="グローバルナビゲーション" className="hidden md:flex items-center gap-0.5 flex-1">
            {PUBLIC_LINKS.map((l) => (
              <NavLink key={l.href} href={l.href} active={pathname === l.href || pathname.startsWith(`${l.href}/`)}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {userId ? (
              <>
                <Link
                  href="/dashboard"
                  aria-current={pathname.startsWith("/dashboard") ? "page" : undefined}
                  className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith("/dashboard")
                      ? "bg-moai-cloud text-moai-ink"
                      : "text-moai-muted hover:text-moai-ink hover:bg-moai-cloud/60"
                  }`}
                >
                  マイページ
                  <span
                    className={`ml-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${
                      activeMode === "client"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-moai-primary/10 text-moai-primary"
                    }`}
                    aria-hidden="true"
                  >
                    {activeMode === "client" ? "発注" : "受注"}
                  </span>
                </Link>
                {activeMode === "client" ? (
                  <Link
                    href="/jobs/new"
                    className="hidden md:inline-flex btn-accent btn-sm gap-1"
                  >
                    依頼する
                  </Link>
                ) : (
                  <Link
                    href="/jobs"
                    className="hidden md:inline-flex btn-accent btn-sm gap-1"
                  >
                    仕事を探す
                  </Link>
                )}
                <CreditsBadge userId={userId} />
                <NotificationBell userId={userId} />
                <button
                  onClick={() => setOpen(!open)}
                  className="md:hidden p-2 rounded-lg hover:bg-moai-cloud transition-colors"
                  aria-label={open ? "メニューを閉じる" : "メニューを開く"}
                  aria-expanded={open}
                  aria-controls="mobile-menu"
                >
                  <svg className="h-5 w-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {open
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />}
                  </svg>
                </button>
                <div className="hidden md:block">
                  <UserMenu
                    displayName={profile?.display_name ?? null}
                    handle={profile?.handle ?? null}
                    avatarUrl={profile?.avatar_url ?? null}
                    activeMode={activeMode}
                  />
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-flex btn-ghost btn-sm">ログイン</Link>
                <Link href="/jobs/new" className="hidden md:inline-flex btn-outline btn-sm">依頼する</Link>
                <Link href="/signup" className="btn-accent btn-sm">無料で始める</Link>
                <button
                  onClick={() => setOpen(!open)}
                  className="md:hidden p-2 rounded-lg hover:bg-moai-cloud transition-colors"
                  aria-label={open ? "メニューを閉じる" : "メニューを開く"}
                  aria-expanded={open}
                  aria-controls="mobile-menu"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {open
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />}
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div id="mobile-menu" className="md:hidden border-t border-moai-border bg-white animate-slide-down">
            <nav aria-label="モバイルナビゲーション" className="container-app py-3 space-y-1">
              {PUBLIC_LINKS.map((l) => {
                const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? "bg-moai-cloud text-moai-ink" : "text-moai-muted hover:bg-moai-cloud hover:text-moai-ink"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
              {userId && (
                <>
                  <div className="divider my-2" />
                  <p className="px-3 pt-1 pb-1 text-[10px] font-semibold text-moai-muted uppercase tracking-wider">マイメニュー</p>
                  {AUTH_LINKS.map((l) => {
                    const active = pathname.startsWith(l.href);
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          active ? "bg-moai-cloud text-moai-ink" : "text-moai-muted hover:bg-moai-cloud hover:text-moai-ink"
                        }`}
                      >
                        <span className="text-base" aria-hidden="true">{l.icon}</span>
                        {l.label}
                      </Link>
                    );
                  })}
                  <div className="divider my-2" />
                  <Link href="/profile/edit" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-moai-cloud text-sm font-medium text-moai-muted hover:text-moai-ink transition-colors">
                    <span className="text-base">👤</span>
                    プロフィール
                  </Link>
                  <div className="px-3 py-2"><SignOutButton /></div>
                </>
              )}
              <div className="divider my-2" />
              <p className="px-3 pt-1 pb-1 text-[10px] font-semibold text-moai-muted uppercase tracking-wider">関連サービス</p>
              {SECONDARY_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-moai-muted hover:bg-moai-cloud hover:text-moai-ink transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] animate-fade-in"
          onClick={close}
          aria-hidden
        />
      )}
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? "text-moai-ink"
          : "text-moai-muted hover:text-moai-ink"
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-moai-primary" aria-hidden="true" />
      )}
    </Link>
  );
}
