"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { setActiveMode, type ActiveMode } from "@/app/actions/mode";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  section?: "primary" | "tools" | "reference";
};

const WORKER_NAV: NavItem[] = [
  { href: "/dashboard", label: "マイページ", icon: "📊", section: "primary" },
  { href: "/jobs", label: "案件を探す", icon: "🔍", section: "primary" },
  { href: "/messages", label: "メッセージ", icon: "💬", section: "primary" },

  { href: "/bank-setup", label: "振込先口座", icon: "🏦", section: "tools" },
  { href: "/earnings", label: "収益", icon: "💰", section: "tools" },
  { href: "/invoices", label: "請求書", icon: "📄", section: "tools" },
  { href: "/credits", label: "クレジット", icon: "💎", section: "tools" },

  { href: "/profile/edit", label: "プロフィール編集", icon: "👤", section: "reference" },
  { href: "/bookmarks", label: "保存済み", icon: "🔖", section: "reference" },
  { href: "/leaderboard", label: "ランキング", icon: "🏆", section: "reference" },
  { href: "/invite", label: "紹介して稼ぐ", icon: "🎁", section: "reference" },
];

const CLIENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "マイページ", icon: "📊", section: "primary" },
  { href: "/jobs/new", label: "案件を投稿", icon: "📝", section: "primary" },
  { href: "/messages", label: "メッセージ", icon: "💬", section: "primary" },

  { href: "/invoices", label: "請求書", icon: "📄", section: "tools" },
  { href: "/credits", label: "クレジット", icon: "💎", section: "tools" },
  { href: "/workers", label: "受注者を探す", icon: "👥", section: "tools" },

  { href: "/profile/edit", label: "プロフィール編集", icon: "👤", section: "reference" },
  { href: "/bookmarks", label: "保存済み", icon: "🔖", section: "reference" },
  { href: "/invite", label: "紹介して稼ぐ", icon: "🎁", section: "reference" },
];

const SECTION_LABEL: Record<string, string> = {
  primary: "よく使う",
  tools: "ツール",
  reference: "その他",
};

function groupBySection(items: NavItem[]) {
  const groups: Record<string, NavItem[]> = { primary: [], tools: [], reference: [] };
  for (const it of items) {
    groups[it.section ?? "primary"].push(it);
  }
  return groups;
}

export default function DashboardSidebar({ activeMode }: { activeMode: ActiveMode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const items = activeMode === "client" ? CLIENT_NAV : WORKER_NAV;
  const otherMode: ActiveMode = activeMode === "client" ? "worker" : "client";
  const groups = groupBySection(items);

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
      router.refresh();
    });
  }

  return (
    <aside className="hidden lg:block lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:self-start">
      <nav aria-label="ダッシュボードメニュー" className="w-56 text-sm">
        {/* モード切替ボタン (Lancers方式: 上部に配置) */}
        <button
          type="button"
          onClick={switchMode}
          disabled={isPending}
          className="group w-full mb-4 flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-moai-border bg-gradient-to-r from-moai-primary/[0.04] to-transparent hover:from-moai-primary/10 hover:border-moai-primary/30 transition-all text-sm font-medium"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-base" aria-hidden="true">
              {otherMode === "client" ? "💼" : "🛠️"}
            </span>
            <span className="truncate">
              {otherMode === "client" ? "発注者に切り替え" : "受注者に切り替え"}
            </span>
          </span>
          <span className="shrink-0 text-moai-muted text-xs group-hover:text-moai-primary transition-colors" aria-hidden="true">
            {isPending ? "…" : "→"}
          </span>
        </button>

        {/* 現在モード表示 */}
        <div className="mb-3 px-3 py-2 rounded-lg bg-moai-cloud/40">
          <div className="text-[10px] uppercase tracking-wider text-moai-muted font-semibold">
            現在のモード
          </div>
          <div className="mt-0.5 font-bold text-moai-ink flex items-center gap-1.5">
            <span aria-hidden="true" className="text-base">
              {activeMode === "client" ? "💼" : "🛠️"}
            </span>
            {activeMode === "client" ? "発注者" : "受注者"}
          </div>
        </div>

        {/* Sections */}
        {(["primary", "tools", "reference"] as const).map((key) => {
          const list = groups[key];
          if (!list || list.length === 0) return null;
          return (
            <div key={key} className="mb-4">
              <div className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-moai-muted font-semibold">
                {SECTION_LABEL[key]}
              </div>
              <ul className="space-y-0.5">
                {list.map((item) => {
                  const active =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                          active
                            ? "bg-moai-primary/10 text-moai-primary font-semibold"
                            : "text-moai-ink hover:bg-moai-cloud/70"
                        }`}
                      >
                        <span className="shrink-0 text-base" aria-hidden="true">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {/* Footer: help link */}
        <div className="mt-6 pt-4 border-t border-moai-border">
          <Link
            href="/how-it-works"
            className="flex items-center gap-2 px-3 py-2 text-xs text-moai-muted hover:text-moai-primary transition-colors"
          >
            <span aria-hidden="true">❓</span>
            使い方ガイド
          </Link>
        </div>
      </nav>
    </aside>
  );
}
