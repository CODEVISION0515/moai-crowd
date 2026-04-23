// 受注者向け Stripe Connect Express アカウント作成 & オンボーディングリンク発行
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[stripe/onboard] STRIPE_SECRET_KEY未設定");
      return NextResponse.json(
        { error: "サーバー設定エラー: Stripeキーが未設定です。運営にお問い合わせください。" },
        { status: 500 },
      );
    }

    const { data: profile, error: profileErr } = await sb
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    if (profileErr) {
      console.error("[stripe/onboard] profile fetch error:", profileErr);
      return NextResponse.json(
        { error: `プロフィール取得失敗: ${profileErr.message}` },
        { status: 500 },
      );
    }

    let accountId = profile?.stripe_account_id;
    if (!accountId) {
      try {
        const account = await stripe.accounts.create({
          type: "express",
          country: "JP",
          email: user.email ?? undefined,
          capabilities: {
            transfers: { requested: true },
            card_payments: { requested: true },
          },
          business_type: "individual",
        });
        accountId = account.id;
        const { error: updateErr } = await sb
          .from("profiles")
          .update({ stripe_account_id: accountId })
          .eq("id", user.id);
        if (updateErr) {
          console.error("[stripe/onboard] profile update error:", updateErr);
          return NextResponse.json(
            { error: `アカウントIDの保存に失敗: ${updateErr.message}` },
            { status: 500 },
          );
        }
      } catch (stripeErr: unknown) {
        console.error("[stripe/onboard] accounts.create error:", stripeErr);
        const msg = stripeErr instanceof Error ? stripeErr.message : "Stripeアカウント作成失敗";
        return NextResponse.json(
          { error: `Stripeアカウント作成エラー: ${msg}` },
          { status: 500 },
        );
      }
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    try {
      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/bank-setup?stripe=refresh`,
        return_url: `${origin}/bank-setup?stripe=return`,
        type: "account_onboarding",
      });
      return NextResponse.json({ url: link.url });
    } catch (linkErr: unknown) {
      console.error("[stripe/onboard] accountLinks.create error:", linkErr);
      const msg = linkErr instanceof Error ? linkErr.message : "リンク生成失敗";
      return NextResponse.json(
        { error: `オンボーディングリンク生成エラー: ${msg}` },
        { status: 500 },
      );
    }
  } catch (e: unknown) {
    console.error("[stripe/onboard] unexpected error:", e);
    const msg = e instanceof Error ? e.message : "不明なエラー";
    return NextResponse.json(
      { error: `予期しないエラー: ${msg}` },
      { status: 500 },
    );
  }
}
