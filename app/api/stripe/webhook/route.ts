// Stripe Webhook: checkout.session.completed を受けて contracts.funded_at を記録
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `invalid signature: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const admin = createAdminClient();

    // 契約エスクロー入金
    const contractId = session.metadata?.contract_id;
    if (contractId) {
      await admin.from("contracts").update({
        status: "working",
        funded_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent as string,
      }).eq("id", contractId);

      const { data: c } = await admin.from("contracts").select("amount_jpy").eq("id", contractId).single();
      if (c) {
        await admin.from("transactions").insert({
          contract_id: contractId,
          kind: "escrow_fund",
          amount_jpy: c.amount_jpy,
          stripe_ref: session.id,
          note: "エスクロー入金",
        });
      }
    }

    // クレジット購入
    if (session.metadata?.type === "credit_purchase") {
      const userId = session.metadata.user_id;
      const credits = Number(session.metadata.credits);
      const packageId = session.metadata.package_id;
      if (userId && credits > 0) {
        await admin.rpc("grant_credits", {
          p_user_id: userId,
          p_amount: credits,
          p_kind: "purchase",
          p_reason: `クレジットパッケージ: ${packageId}`,
          p_metadata: { package_id: packageId, session_id: session.id },
          p_stripe_pi: session.payment_intent as string,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}

export const config = { api: { bodyParser: false } };
