// OAuth / メール認証の callback エンドポイント
// Supabase が発行した code/token を session に交換し、
// プロフィール状態に応じて onboarding か dashboard へ振り分ける
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 自動生成ハンドルパターン: `user_` + UUID先頭8文字 (16進)
// handle_new_user() トリガーでこの形式で自動セットされる
const AUTO_HANDLE = /^user_[a-f0-9]{8}$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const sb = await createClient();
  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=session_missing", url.origin));
  }

  // プロフィール状態でオンボーディング完了を判定
  // - handle なし: 異常（トリガー実行前？）→ オンボーディングへ
  // - handle が自動生成パターン: まだカスタマイズされていない → オンボーディングへ
  // - それ以外（カスタムハンドル設定済み）: 既にオンボーディング完了 → next (dashboard) へ
  const { data: profile } = await sb
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();

  const needsOnboarding = !profile?.handle || AUTO_HANDLE.test(profile.handle);
  if (needsOnboarding) {
    return NextResponse.redirect(new URL("/onboarding", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
