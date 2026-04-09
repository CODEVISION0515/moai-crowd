"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import SignOutButton from "@/components/SignOutButton";
import NotificationBell from "@/components/NotificationBell";
import CreditsBadge from "@/components/CreditsBadge";

const PUBLIC_LINKS = [
  { href: "/jobs", label: "案件" },
  { href: "/workers", label: "メンバー" },
  { href: "/community", label: "コミュニティ" },
  { href: "/events", label: "イベント" },
];

const AUTH_LINKS = [
  { href: "/dashboard", label: "マイページ" },
  { href: "/jobs/new", label: "依頼する" },
  { href: "/bookmarks", label: "保存済み" },
  { href: "/messages", label: "メッセージ" },
  { href: "/credits", label: "クレジット" },
  { href: "/invoices", label: "請求書" },
  { href: "/earnings", label: "収益" },
  { href: "/leaderboard", label: "ランキング" },
];

export default function Header({ userId }: { userId: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-moai-border">
      <div className="container-app flex items-center justify-between h-[var(--header-h)]">
        <Link href="/" className="flex items-center gap-2 font-semibold text-base">
          <span className="text-moai-primary font-bold">MOAI</span>
          <span className="text-moai-muted font-normal text-sm">Crowd</span>
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
              <Link href="/jobs/new" className="hidden md:inline-flex btn-primary btn-sm">依頼する</Link>
              <CreditsBadge userId={userId} />
              <NotificationBell userId={userId} />
              <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-moai-cloud" aria-label="メニュー">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {open
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
              <div className="hidden md:block"><SignOutButton /></div>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex btn-ghost btn-sm">ログイン</Link>
              <Link href="/signup" className="btn-primary btn-sm">始める</Link>
              <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-moai-cloud" aria-label="メニュー">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="md:hidden border-t border-moai-border bg-white animate-fade-in">
          <div className="container-app py-2 grid gap-0.5">
            {PUBLIC_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="px-3 py-2.5 rounded-lg hover:bg-moai-cloud text-sm font-medium">
                {l.label}
              </Link>
            ))}
            {userId && (
              <>
                <div className="divider my-1.5" />
                {AUTH_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} className="px-3 py-2.5 rounded-lg hover:bg-moai-cloud text-sm font-medium">
                    {l.label}
                  </Link>
                ))}
                <div className="divider my-1.5" />
                <Link href="/profile/edit" className="px-3 py-2.5 rounded-lg hover:bg-moai-cloud text-sm font-medium">プロフィール</Link>
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
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active ? "bg-moai-cloud text-moai-ink" : "text-moai-muted hover:text-moai-ink hover:bg-moai-cloud"
      }`}
    >
      {children}
    </Link>
  );
}
