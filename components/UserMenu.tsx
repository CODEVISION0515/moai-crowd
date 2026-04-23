"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar } from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import { setActiveMode, type ActiveMode } from "@/app/actions/mode";

const WORKER_LINKS = [
  { href: "/dashboard", label: "マイページ", icon: "📊", primary: true },
  { href: "/jobs", label: "案件を探す", icon: "🔍" },
  { href: "/bank-setup", label: "振込先口座", icon: "🏦" },
  { href: "/earnings", label: "収益", icon: "💰" },
  { href: "/profile/edit", label: "プロフィール編集", icon: "👤" },
  { href: "/bookmarks", label: "保存済み", icon: "🔖" },
  { href: "/messages", label: "メッセージ", icon: "💬" },
  { href: "/credits", label: "クレジット", icon: "💎" },
  { href: "/invite", label: "紹介して稼ぐ", icon: "🎁" },
  { href: "/leaderboard", label: "ランキング", icon: "🏆" },
];

const CLIENT_LINKS = [
  { href: "/dashboard", label: "マイページ", icon: "📊", primary: true },
  { href: "/jobs/new", label: "案件を投稿", icon: "📝" },
  { href: "/invoices", label: "請求書", icon: "📄" },
  { href: "/credits", label: "クレジット", icon: "💎" },
  { href: "/profile/edit", label: "プロフィール編集", icon: "👤" },
  { href: "/bookmarks", label: "保存済み", icon: "🔖" },
  { href: "/messages", label: "メッセージ", icon: "💬" },
  { href: "/invite", label: "紹介して稼ぐ", icon: "🎁" },
  { href: "/leaderboard", label: "ランキング", icon: "🏆" },
];

export default function UserMenu({
  displayName,
  handle,
  avatarUrl,
  activeMode = "worker",
}: {
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  activeMode?: ActiveMode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const menuLinks = activeMode === "client" ? CLIENT_LINKS : WORKER_LINKS;
  const otherMode: ActiveMode = activeMode === "client" ? "worker" : "client";

  function switchMode() {
    startTransition(async () => {
      const res = await setActiveMode(otherMode);
      if (!res.ok) {
        toast.error(`モード切替に失敗しました: ${res.error ?? ""}`);
        return;
      }
      toast.success(
        otherMode === "client" ? "発注者モードに切り替えました" : "受注者モードに切り替えました",
      );
      setOpen(false);
      router.refresh();
    });
  }

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    await createClient().auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="アカウントメニュー"
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-moai-border hover:border-moai-primary/40 hover:bg-moai-cloud/40 transition-colors"
      >
        <span className="relative h-7 w-7 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-xs font-semibold text-moai-muted">
          <Avatar src={avatarUrl} name={displayName} size={28} />
        </span>
        <svg
          className={`h-3.5 w-3.5 text-moai-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="アカウント"
          className="absolute right-0 top-[calc(100%+6px)] w-72 rounded-xl border border-moai-border bg-white shadow-lg overflow-hidden animate-fade-in z-50"
        >
          {/* Header: name / handle + mode badge */}
          <div className="px-4 py-3 border-b border-moai-border bg-moai-cloud/30">
            <div className="flex items-center gap-3">
              <span className="relative h-10 w-10 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-sm font-semibold text-moai-muted shrink-0">
                <Avatar src={avatarUrl} name={displayName} size={40} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">
                  {displayName || "ユーザー"}
                </div>
                {handle && (
                  <Link
                    href={`/profile/${handle}`}
                    className="text-xs text-moai-muted hover:text-moai-primary truncate block"
                  >
                    @{handle}
                  </Link>
                )}
              </div>
              <span
                className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  activeMode === "client"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-moai-primary/10 text-moai-primary"
                }`}
                aria-label={`現在のモード: ${activeMode === "client" ? "発注者" : "受注者"}`}
              >
                {activeMode === "client" ? "発注者" : "受注者"}
              </span>
            </div>
          </div>

          {/* Mode switch (Lancers-style): at the very top */}
          <button
            type="button"
            onClick={switchMode}
            disabled={isPending}
            role="menuitem"
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-moai-primary/5 to-transparent hover:from-moai-primary/10 transition-colors border-b border-moai-border"
          >
            <span className="flex items-center gap-2">
              <span className="text-base" aria-hidden="true">
                {otherMode === "client" ? "💼" : "🛠️"}
              </span>
              <span>
                {otherMode === "client" ? "発注者に切り替え" : "受注者に切り替え"}
              </span>
            </span>
            <span className="text-moai-muted text-xs" aria-hidden="true">
              {isPending ? "…" : "→"}
            </span>
          </button>

          {/* Primary: マイページ */}
          <div className="py-1">
            {menuLinks.filter((l) => l.primary).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-moai-primary hover:bg-moai-cloud/60 transition-colors"
              >
                <span className="text-base" aria-hidden="true">{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-moai-border" />

          {/* Secondary */}
          <div className="py-1 max-h-[60vh] overflow-y-auto">
            {menuLinks.filter((l) => !l.primary).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2 text-sm text-moai-ink hover:bg-moai-cloud/60 transition-colors"
              >
                <span className="text-base" aria-hidden="true">{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-moai-border" />

          {/* Sign out */}
          <button
            type="button"
            onClick={signOut}
            role="menuitem"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-moai-muted hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="text-base" aria-hidden="true">🚪</span>
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
