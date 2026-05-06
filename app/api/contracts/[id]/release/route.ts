// エスクロー解放: 発注者の承認で契約を released に進める
//
// 手動振込モード（Stripe Connect 不在時）:
//   - 受注者の銀行口座が profiles テーブルに登録済みかをチェック
//   - 自動送金は行わず、契約ステータスのみ released に進める
//   - 実際の振込は運営が /admin/payouts から手動で処理
//
// Stripe Connect が将来有効化されたら、コメントアウトされた Transfer ロジックを復活させる。
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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

  // 受注者の銀行口座登録チェック（手動振込モード）
  const { data: worker } = await admin
    .from("profiles")
    .select("bank_name, bank_account_number, bank_account_holder")
    .eq("id", contract.worker_id)
    .single();

  const bankRegistered = !!(
    worker?.bank_name &&
    worker?.bank_account_number &&
    worker?.bank_account_holder
  );

  if (!bankRegistered) {
    return NextResponse.json(
      {
        error: "受注者の振込先口座が未登録のため、検収を確定できません。受注者に /bank-setup での登録を依頼してください。",
      },
      { status: 400 },
    );
  }

  // ────────────────────────────────────────────────
  // Stripe Connect 復活時に有効化するブロック
  // ────────────────────────────────────────────────
  // let transferRef: string | null = null;
  // if (contract.stripe_payment_intent_id && worker.stripe_account_id) {
  //   try {
  //     const transfer = await stripe.transfers.create({
  //       amount: contract.worker_payout_jpy,
  //       currency: "jpy",
  //       destination: worker.stripe_account_id,
  //       metadata: { contract_id: id },
  //     });
  //     transferRef = transfer.id;
  //   } catch (e: unknown) {
  //     const msg = e instanceof Error ? e.message : "Transfer例外";
  //     await recordTransferFailure(admin, contract, msg);
  //     return NextResponse.json({ error: `transfer_failed: ${msg}` }, { status: 500 });
  //   }
  // }
  // ────────────────────────────────────────────────

  await admin.from("contracts").update({
    status: "released",
    released_at: new Date().toISOString(),
  }).eq("id", id);

  await admin.from("transactions").insert([
    {
      contract_id: id,
      kind: "escrow_release",
      amount_jpy: contract.worker_payout_jpy,
      note: "受注者への支払い (運営による手動振込待ち)",
    },
    {
      contract_id: id,
      kind: "platform_fee",
      amount_jpy: contract.platform_fee_jpy,
      note: "プラットフォーム手数料",
    },
  ]);
  await admin.from("jobs").update({ status: "completed" }).eq("id", contract.job_id);

  await admin.rpc("notify_admins", {
    p_title: "💸 振込待ち案件が発生",
    p_body: `契約ID: ${id} / 受注者支払額: ¥${contract.worker_payout_jpy.toLocaleString()}`,
    p_link: `/admin/payouts`,
  });

  return NextResponse.json({ ok: true });
}
