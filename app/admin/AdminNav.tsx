"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "ダッシュボード", exact: true },
  { href: "/admin/reports", label: "通報" },
  { href: "/admin/users", label: "ユーザー" },
  { href: "/admin/jobs", label: "案件" },
  { href: "/admin/contracts", label: "契約" },
  { href: "/admin/transactions", label: "取引" },
  { href: "/admin/credits", label: "🪙 クレジット" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="管理画面ナビゲーション" className="flex gap-1 text-sm flex-wrap">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium ${
              active
                ? "bg-moai-primary/10 text-moai-primary"
                : "text-moai-muted hover:text-moai-ink hover:bg-moai-cloud"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
