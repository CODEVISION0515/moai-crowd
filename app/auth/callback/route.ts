// OAuth / メール認証の callback エンドポイント
// Supabase が発行した code/token を session に交換してリダイレクト
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const isNewUser = url.searchParams.get("new") === "1";

  if (code) {
    const sb = await createClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) {
      // エラーページへリダイレクト（クエリ付き）
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
      );
    }

    // 初回サインアップ or オンボーディング未完了ならオンボーディングへ
    if (isNewUser) {
      return NextResponse.redirect(new URL("/onboarding", url.origin));
    }

    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      const { data: profile } = await sb
        .from("profiles")
        .select("handle")
        .eq("id", user.id)
        .maybeSingle();
      // ハンドル未設定＝オンボーディング未完了
      if (!profile?.handle) {
        return NextResponse.redirect(new URL("/onboarding", url.origin));
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
