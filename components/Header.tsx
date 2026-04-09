"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import SignOutButton from "@/components/SignOutButton";
import NotificationBell from "@/components/NotificationBell";
import CreditsBadge from "@/components/CreditsBadge";

const PUBLIC_LINKS = [
  { href: "/jobs", label: "案件" },
  { href: "/workers", label: "仲間" },
  { href: "/community", label: "コミュニティ" },
  { href: "/events", label: "イベント" },
];

const AUTH_LINKS = [
  { href: "/dashboard", label: "マイページ" },
  { href: "/jobs/new", label: "依頼する" },
  { href: "/bookmarks", label: "保存した案件" },
  { href: "/messages", label: "DM" },
  { href: "/credits", label: "🪙 クレジット" },
  { href: "/invoices", label: "請求書" },
  { href: "/earnings", label: "収益" },
  { href: "/leaderboard", label: "🏆 ランキング" },
];

export default function Header({ userId }: { userId: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className={`sticky top-0 z-40 transition-all ${scrolled ? "glass shadow-soft" : "bg-white border-b border-slate-100"}`}>
      <div className="container-app flex items-center justify-between h-[var(--header-h)]">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-moai-primary to-moai-primary-700 text-white text-sm font-black shadow-soft">M</span>
          <span className="hidden sm:inline">
            MOAI <span className="text-moai-accent">Crowd</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {PUBLIC_LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} active={pathname.startsWith(l.href)}>{l.label}</NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {userId ? (
            <>
              <Link href="/jobs/new" className="hidden md:inline-flex btn-primary btn-sm">+ 依頼する</Link>
              <CreditsBadge userId={userId} />
              <NotificationBell userId={userId} />
              <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-slate-100" aria-label="メニュー">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {open
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
              <div className="hidden md:block"><SignOutButton /></div>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex btn-ghost btn-sm">ログイン</Link>
              <Link href="/signup" className="btn-primary btn-sm">無料で始める</Link>
              <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-slate-100" aria-label="メニュー">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {open
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white animate-slide-up">
          <div className="container-app py-3 grid gap-1">
            {PUBLIC_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="px-3 py-3 rounded-xl hover:bg-slate-50 font-medium">
                {l.label}
              </Link>
            ))}
            {userId && (
              <>
                <div className="divider my-2" />
                {AUTH_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} className="px-3 py-3 rounded-xl hover:bg-slate-50 font-medium">
                    {l.label}
                  </Link>
                ))}
                <div className="divider my-2" />
                <Link href="/profile/edit" className="px-3 py-3 rounded-xl hover:bg-slate-50 font-medium">プロフィール編集</Link>
                <div className="px-3 py-2"><SignOutButton /></div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
        active ? "bg-moai-primary/10 text-moai-primary" : "text-slate-600 hover:text-moai-primary hover:bg-slate-50"
      }`}
    >
      {children}
    </Link>
  );
}
