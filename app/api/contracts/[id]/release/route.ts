// エスクロー解放: 発注者の承認で受注者のConnectアカウントへTransfer
// Transfer 失敗時は契約ステータスを進めず admin に通知する
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

  if (!worker?.stripe_account_id) {
    await recordTransferFailure(admin, contract, "受注者のStripe Connect未設定");
    return NextResponse.json(
      { error: "受注者の振込先口座が未設定です（Stripe Connect未完了）" },
      { status: 400 }
    );
  }

  let transferRef: string | null = null;
  if (contract.stripe_payment_intent_id) {
    try {
      const transfer = await stripe.transfers.create({
        amount: contract.worker_payout_jpy,
        currency: "jpy",
        destination: worker.stripe_account_id,
        metadata: { contract_id: id },
      });
      transferRef = transfer.id;
    } catch (e: any) {
      await recordTransferFailure(admin, contract, e?.message ?? "Transfer例外");
      return NextResponse.json(
        { error: `transfer_failed: ${e?.message ?? "unknown"}` },
        { status: 500 }
      );
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

async function recordTransferFailure(
  admin: ReturnType<typeof createAdminClient>,
  contract: { id: string; worker_payout_jpy: number },
  reason: string,
) {
  await admin.from("contracts").update({
    transfer_failed_at: new Date().toISOString(),
    transfer_failure_reason: reason,
  }).eq("id", contract.id);

  await admin.from("transactions").insert({
    contract_id: contract.id,
    kind: "transfer_failed",
    amount_jpy: contract.worker_payout_jpy,
    note: `Transfer失敗: ${reason}`,
  });

  await admin.rpc("notify_admins", {
    p_title: "⚠️ Stripe Transfer失敗",
    p_body: `契約ID: ${contract.id} / 理由: ${reason}`,
    p_link: `/admin/contracts/${contract.id}`,
  });
}
