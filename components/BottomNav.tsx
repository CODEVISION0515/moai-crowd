"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "ホーム", icon: HomeIcon },
  { href: "/jobs", label: "案件", icon: BriefcaseIcon, exclude: ["/jobs/new"] },
  { href: "/jobs/new", label: "依頼", icon: PlusIcon, primary: true },
  { href: "/messages", label: "DM", icon: ChatIcon },
  { href: "/dashboard", label: "マイ", icon: UserIcon },
] satisfies ReadonlyArray<{
  href: string;
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
  primary?: boolean;
  exclude?: readonly string[];
}>;

const AUTH_PATHS = ["/login", "/signup", "/signup/confirm", "/forgot-password", "/auth/reset-password"];

/**
 * パスのアクティブ判定。
 * - "/" は完全一致のみ
 * - それ以外は href の完全一致 or `${href}/` で始まる場合に active
 *   ただし exclude に該当するパスはスキップ（例: /jobs は /jobs/new を active 扱いしない）
 */
function isActive(href: string, pathname: string, exclude?: readonly string[]): boolean {
  if (href === "/") return pathname === "/";
  if (exclude?.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomNav({ userId }: { userId: string | null }) {
  const pathname = usePathname();
  if (!userId) return null;
  // 認証ページでは非表示
  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <nav
      aria-label="メインナビゲーション"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/80 backdrop-blur-md border-t border-moai-border"
    >
      <ul className="grid grid-cols-5 h-[var(--bottomnav-h)] safe-bottom">
        {ITEMS.map((item) => {
          const active = isActive(item.href, pathname, item.exclude);
          const Icon = item.icon;

          if (item.primary) {
            return (
              <li key={item.href} className="contents">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className="flex items-center justify-center"
                >
                  <span
                    className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-moai-primary text-white shadow-md active:scale-95 transition-transform"
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href} className="contents">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors"
              >
                <span className="relative" aria-hidden="true">
                  <Icon className={`h-5 w-5 transition-colors ${active ? "text-moai-primary" : "text-slate-400"}`} />
                </span>
                <span className={`transition-colors ${active ? "text-moai-primary font-semibold" : "text-slate-500"}`}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-moai-primary" aria-hidden="true" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon(props: React.SVGProps<SVGSVGElement>) { return (<svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" /></svg>); }
function BriefcaseIcon(props: React.SVGProps<SVGSVGElement>) { return (<svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5V4a2 2 0 012-2h2a2 2 0 012 2v1m4 0H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z" /></svg>); }
function PlusIcon(props: React.SVGProps<SVGSVGElement>) { return (<svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>); }
function ChatIcon(props: React.SVGProps<SVGSVGElement>) { return (<svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.85L3 20l1.4-3.7C3.5 15 3 13.6 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" /></svg>); }
function UserIcon(props: React.SVGProps<SVGSVGElement>) { return (<svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>); }
