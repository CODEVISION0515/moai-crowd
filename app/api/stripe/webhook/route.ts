// Stripe Webhook: 契約エスクロー入金・クレジット購入・支払い失敗を処理
// - 署名検証
// - stripe_event_id による冪等性チェック（同じ event を二重処理しない）
// - 各ハンドラーは独立してログ可能に
//
// App Router の Route Handler では署名検証用に raw body を `await req.text()` で取得する。
// （Pages Router の `export const config = { api: { bodyParser: false } }` は無効）
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

// Node.js ランタイム必須（Stripe SDK / 署名検証は Edge では動かない）
export const runtime = "nodejs";
// Webhook は常に最新を処理する
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `invalid signature: ${err.message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  // 冪等性チェック: 同じ event.id を処理済みなら即リターン
  const { data: existing } = await admin
    .from("transactions")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(admin, event);
        break;
      case "payment_intent.payment_failed":
      case "charge.failed":
        await handlePaymentFailed(admin, event);
        break;
    }
  } catch (err: any) {
    console.error("[stripe webhook] handler error", { type: event.type, id: event.id, err });
    return NextResponse.json({ error: err?.message ?? "handler_error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Stripe 署名検証は raw body（文字列）必須。`req.text()` で取得しているため bodyParser 設定は不要。

async function handleCheckoutCompleted(
  admin: ReturnType<typeof createAdminClient>,
  event: Stripe.Event,
) {
  const session = event.data.object as Stripe.Checkout.Session;

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
        stripe_event_id: event.id,
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
        p_metadata: { package_id: packageId, session_id: session.id, event_id: event.id },
        p_stripe_pi: session.payment_intent as string,
      });
    }
  }
}

async function handlePaymentFailed(
  admin: ReturnType<typeof createAdminClient>,
  event: Stripe.Event,
) {
  const obj = event.data.object as Stripe.PaymentIntent | Stripe.Charge;
  // metadata.contract_id は PaymentIntent / Charge どちらからも取れる
  const contractId = (obj as any).metadata?.contract_id as string | undefined;
  const amount = (obj as any).amount_received ?? (obj as any).amount ?? 0;
  const failureMessage =
    (obj as Stripe.PaymentIntent).last_payment_error?.message ??
    (obj as Stripe.Charge).failure_message ??
    "支払いに失敗しました";

  // transactions にイベントを記録（event_id で冪等性確保）
  await admin.from("transactions").insert({
    contract_id: contractId ?? null,
    kind: "charge_failed",
    amount_jpy: amount,
    stripe_ref: obj.id,
    stripe_event_id: event.id,
    note: `支払い失敗: ${failureMessage}`,
  });

  // 契約に紐づく失敗なら status を戻す
  if (contractId) {
    const { data: contract } = await admin
      .from("contracts").select("status, client_id").eq("id", contractId).maybeSingle();
    if (contract && contract.status === "working") {
      // まだ funded が確定していないので funded に戻す
      await admin.from("contracts").update({
        status: "funded",
        funded_at: null,
      }).eq("id", contractId);
    }

    // クライアントへ通知
    if (contract?.client_id) {
      await admin.from("notifications").insert({
        user_id: contract.client_id,
        kind: "contract_funded",
        title: "⚠️ 支払いに失敗しました",
        body: failureMessage,
        link: `/contracts/${contractId}`,
      });
    }

    // 管理者アラート
    await admin.rpc("notify_admins", {
      p_title: "⚠️ 支払い失敗 (charge/payment_intent)",
      p_body: `契約ID: ${contractId} / 理由: ${failureMessage}`,
      p_link: `/admin/contracts/${contractId}`,
    });
  }
}
