// 受注者向け Stripe Connect Express アカウント作成 & オンボーディングリンク発行
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await sb.from("profiles").select("stripe_account_id").eq("id", user.id).single();

  let accountId = profile?.stripe_account_id;
  if (!accountId) {
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
    await sb.from("profiles").update({ stripe_account_id: accountId }).eq("id", user.id);
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/profile/edit?stripe=refresh`,
    return_url: `${origin}/profile/edit?stripe=return`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: link.url });
}
