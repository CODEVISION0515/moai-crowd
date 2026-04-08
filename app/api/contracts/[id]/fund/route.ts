// 契約のエスクロー資金確保: Stripe Checkout Session を作成してリダイレクト
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: contract } = await sb
    .from("contracts")
    .select("*, jobs(title)")
    .eq("id", id)
    .single();
  if (!contract || contract.client_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "jpy",
        product_data: { name: `【MOAI Crowd】${contract.jobs?.title ?? "案件"}` },
        unit_amount: contract.amount_jpy,
      },
      quantity: 1,
    }],
    metadata: { contract_id: contract.id },
    success_url: `${origin}/dashboard?contract=${contract.id}&status=funded`,
    cancel_url: `${origin}/dashboard?contract=${contract.id}&status=canceled`,
  });

  return NextResponse.json({ url: session.url });
}
