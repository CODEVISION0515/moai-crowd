"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import SignOutButton from "@/components/SignOutButton";
import NotificationBell from "@/components/NotificationBell";
import CreditsBadge from "@/components/CreditsBadge";
import UserMenu from "@/components/UserMenu";

const PUBLIC_LINKS = [
  { href: "/school", label: "スクール" },
  { href: "/jobs", label: "案件" },
  { href: "/community", label: "コミュニティ" },
  { href: "/workers", label: "メンバー" },
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

/**
 * ナビゲーションのアクティブ判定。
 * `pathname.startsWith(href)` を素朴に使うと `/jobs` が `/jobs/new` でも反応してしまうので、
 * 完全一致 or `${href}/` 始まり を見る。
 */
function isNavActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
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

  // hooks は常に同じ順序で呼ぶ必要があるため、早期 return より前に宣言する
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // 認証ページではロゴだけのミニマルヘッダーに
  if (isAuthPath(pathname)) {
    return (
      <header className="sticky top-0 z-40 bg-white border-b border-moai-border">
        <div className="container-app flex items-center h-[var(--header-h)]">
          <Link href="/" aria-label="MOAI ホーム" className="flex items-baseline gap-1.5 group">
            <span className="text-lg font-bold text-moai-primary transition-colors group-hover:text-moai-primary-800">
              MOAI
            </span>
            <span className="text-[10px] font-medium text-moai-muted tracking-wide hidden sm:inline">
              ゆんたく・まなぶ・つくる
            </span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled
            ? "bg-white/80 backdrop-blur-md shadow-soft border-b border-transparent"
            : "bg-white border-b border-moai-border"
        }`}
      >
        <div className="container-app flex items-center justify-between h-[var(--header-h)]">
          {/* Logo */}
          <Link href="/" aria-label="MOAI ホーム" className="flex items-baseline gap-1.5 group">
            <span className="text-lg font-bold text-moai-primary transition-colors group-hover:text-moai-primary-800">
              MOAI
            </span>
            <span className="text-[10px] font-medium text-moai-muted tracking-wide hidden sm:inline">
              ゆんたく・まなぶ・つくる
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="グローバルナビゲーション" className="hidden md:flex items-center gap-0.5">
            {PUBLIC_LINKS.map((l) => (
              <NavLink key={l.href} href={l.href} active={isNavActive(l.href, pathname)}>
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
                  aria-current={isNavActive("/dashboard", pathname) ? "page" : undefined}
                  className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isNavActive("/dashboard", pathname)
                      ? "bg-moai-cloud text-moai-ink"
                      : "text-moai-muted hover:text-moai-ink hover:bg-moai-cloud/60"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
                  </svg>
                  マイページ
                  <span
                    className={`ml-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${
                      activeMode === "client"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-moai-primary/10 text-moai-primary"
                    }`}
                    aria-hidden="true"
                  >
                    {activeMode === "client" ? "発注者" : "受注者"}
                  </span>
                </Link>
                {activeMode === "client" ? (
                  <Link
                    href="/jobs/new"
                    className="hidden md:inline-flex btn-accent btn-sm gap-1"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    依頼する
                  </Link>
                ) : (
                  <Link
                    href="/jobs"
                    className="hidden md:inline-flex btn-accent btn-sm gap-1"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                    案件を探す
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
                const active = isNavActive(l.href, pathname);
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
                    const active = isNavActive(l.href, pathname);
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
