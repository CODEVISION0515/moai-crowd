// Connectアカウント状態確認
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await sb.from("profiles").select("stripe_account_id").eq("id", user.id).single();
  if (!profile?.stripe_account_id) return NextResponse.json({ connected: false });

  const account = await stripe.accounts.retrieve(profile.stripe_account_id);
  return NextResponse.json({
    connected: true,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
  });
}
