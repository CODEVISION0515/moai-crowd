// 契約のエスクロー資金確保: Stripe Checkout Session を作成してリダイレクト
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const { data: contract } = await sb
    .from("contracts")
    .select("*, jobs(title)")
    .eq("id", id)
    .single();
  if (!contract) {
    return NextResponse.json({ error: "契約が見つかりません" }, { status: 404 });
  }
  if (contract.client_id !== user.id) {
    return NextResponse.json({ error: "この契約を入金できるのは発注者だけです" }, { status: 403 });
  }
  // 既に入金済みなら 2 重決済を防ぐ
  if (contract.funded_at) {
    return NextResponse.json({ error: "この契約は既に入金済みです" }, { status: 400 });
  }
  if (!["funded", "negotiating"].includes(contract.status)) {
    return NextResponse.json(
      { error: "現在のステータスでは入金できません" },
      { status: 400 },
    );
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
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
      success_url: `${origin}/contracts/${contract.id}?funded=1`,
      cancel_url: `${origin}/contracts/${contract.id}?canceled=1`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Stripe Checkout の作成に失敗しました" },
      { status: 500 },
    );
  }
}
