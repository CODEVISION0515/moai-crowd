// ブラウザ用 Supabase クライアント
// Cookie `sb-session-only=1` が立っている場合は sessionStorage で永続化し、
// ブラウザを閉じると自動でログアウトする。未設定時は localStorage (デフォルト・長期保持)。
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // SSR (無window) 時はデフォルト
  if (typeof window === "undefined") {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }

  const sessionOnly = document.cookie.split(";").some((c) => c.trim().startsWith("sb-session-only=1"));

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    sessionOnly
      ? { auth: { storage: window.sessionStorage } }
      : undefined,
  );
}

/**
 * ログイン保持トグル。true=30日保持 (localStorage) / false=ブラウザ閉じたらログアウト (sessionStorage)。
 * 切り替え前に呼ぶこと。
 */
export function setSessionPersistence(remember: boolean) {
  if (typeof document === "undefined") return;
  if (remember) {
    // 保持モード → cookie 削除
    document.cookie = "sb-session-only=; path=/; max-age=0";
  } else {
    // 短期モード → cookie 設定 (SameSite=Lax, セキュアは HTTPS のみ自動)
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `sb-session-only=1; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`;
  }
}
