// エスクロー解放: 発注者の承認で受注者のConnectアカウントへTransfer
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: contract } = await sb.from("contracts").select("*").eq("id", id).single();
  if (!contract || contract.client_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!["submitted", "working", "funded"].includes(contract.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 受注者のConnectアカウント取得
  const { data: worker } = await admin
    .from("profiles").select("stripe_account_id").eq("id", contract.worker_id).single();

  let transferRef: string | null = null;
  if (worker?.stripe_account_id && contract.stripe_payment_intent_id) {
    try {
      const transfer = await stripe.transfers.create({
        amount: contract.worker_payout_jpy,
        currency: "jpy",
        destination: worker.stripe_account_id,
        metadata: { contract_id: id },
      });
      transferRef = transfer.id;
    } catch (e: any) {
      return NextResponse.json({ error: `transfer_failed: ${e.message}` }, { status: 500 });
    }
  }

  await admin.from("contracts").update({
    status: "released",
    released_at: new Date().toISOString(),
  }).eq("id", id);

  await admin.from("transactions").insert([
    { contract_id: id, kind: "escrow_release", amount_jpy: contract.worker_payout_jpy, stripe_ref: transferRef, note: "受注者への支払い" },
    { contract_id: id, kind: "platform_fee", amount_jpy: contract.platform_fee_jpy, note: "プラットフォーム手数料" },
  ]);
  await admin.from("jobs").update({ status: "completed" }).eq("id", contract.job_id);

  return NextResponse.json({ ok: true, transfer: transferRef });
}
