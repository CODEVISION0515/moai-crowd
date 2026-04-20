"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";
import { statefulFormAction } from "@/lib/actions";
import { approveDeliverableSchema, requestRevisionSchema } from "@/lib/validations";

type AdminSb = ReturnType<typeof createAdminClient>;
type TransferResult =
  | { ok: true; transferId: string | null; skipped?: boolean }
  | { ok: false; reason: string };

async function transferToWorker(
  admin: AdminSb,
  contract: { worker_id: string; worker_payout_jpy: number; stripe_payment_intent_id: string | null; id: string },
): Promise<TransferResult> {
  const { data: worker } = await admin
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", contract.worker_id)
    .single();

  if (!worker?.stripe_account_id) {
    return { ok: false, reason: "受注者の振込先口座が未設定です（Stripe Connect未完了）" };
  }
  if (!contract.stripe_payment_intent_id) {
    // エスクロー未入金 — Transfer 不要ケース（例: 手動テスト）
    return { ok: true, transferId: null, skipped: true };
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: contract.worker_payout_jpy,
      currency: "jpy",
      destination: worker.stripe_account_id,
      metadata: { contract_id: contract.id },
    });
    return { ok: true, transferId: transfer.id };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? "Stripe Transfer エラー" };
  }
}

async function recordRelease(
  admin: AdminSb,
  contract: { id: string; job_id: string; worker_payout_jpy: number; platform_fee_jpy: number },
  transferRef: string | null,
) {
  await admin.from("contracts").update({
    status: "released",
    released_at: new Date().toISOString(),
  }).eq("id", contract.id);

  await admin.from("transactions").insert([
    { contract_id: contract.id, kind: "escrow_release", amount_jpy: contract.worker_payout_jpy, stripe_ref: transferRef, note: "受注者への支払い" },
    { contract_id: contract.id, kind: "platform_fee", amount_jpy: contract.platform_fee_jpy, note: "プラットフォーム手数料" },
  ]);

  await admin.from("jobs").update({ status: "completed" }).eq("id", contract.job_id);
}

async function recordTransferFailure(
  admin: AdminSb,
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

  // 管理者へアラート
  await admin.rpc("notify_admins", {
    p_title: "⚠️ Stripe Transfer失敗",
    p_body: `契約ID: ${contract.id} / 理由: ${reason}`,
    p_link: `/admin/contracts/${contract.id}`,
  });
}

async function awardReferralRewards(
  admin: AdminSb,
  contract: { client_id: string; worker_id: string },
) {
  // RPC内で原子的に「初回かつ未報酬」を判定するため、両方とも無条件に呼んで良い
  await Promise.all([
    admin.rpc("award_referral_first_deal", { p_referee_id: contract.client_id, p_segment: "client" }),
    admin.rpc("award_referral_first_deal", { p_referee_id: contract.worker_id, p_segment: "worker" }),
  ]);
}

export const approveDeliverable = statefulFormAction(approveDeliverableSchema, async ({ sb, user, data }) => {
  const { deliverable_id } = data;

  const { data: deliverable } = await sb
    .from("deliverables")
    .select("contract_id")
    .eq("id", deliverable_id)
    .single();
  if (!deliverable) return { error: "成果物が見つかりません" };

  const contractId = deliverable.contract_id;

  // Admin クライアントで RLS をバイパスして release 処理
  const admin = createAdminClient();
  const { data: contract } = await admin
    .from("contracts")
    .select("*")
    .eq("id", contractId)
    .single();
  if (!contract || contract.client_id !== user.id) {
    return { error: "承認権限がありません" };
  }

  // 先に Transfer を試行。失敗したら契約ステータスは進めずエラー返却
  const result = await transferToWorker(admin, contract);
  if (!result.ok) {
    await recordTransferFailure(admin, contract, result.reason);
    return {
      error: `支払い処理に失敗しました: ${result.reason}。管理者に通知済みです。`,
    };
  }

  // Transfer 成功 → 成果物承認 & release 記録
  await sb.from("deliverables").update({
    review_status: "approved",
    reviewed_at: new Date().toISOString(),
  }).eq("id", deliverable_id);

  await recordRelease(admin, contract, result.transferId);
  await awardReferralRewards(admin, contract);

  revalidatePath(`/contracts/${contractId}`);
  return { success: "成果物を承認し、支払いを完了しました" };
});

export const requestRevision = statefulFormAction(requestRevisionSchema, async ({ sb, data }) => {
  const { deliverable_id, revision_note } = data;

  const { data: deliverable } = await sb
    .from("deliverables")
    .select("contract_id")
    .eq("id", deliverable_id)
    .single();
  if (!deliverable) return { error: "成果物が見つかりません" };

  await sb.from("deliverables").update({
    review_status: "revision_requested",
    reviewed_at: new Date().toISOString(),
    revision_note,
  }).eq("id", deliverable_id);

  await sb.from("contracts").update({ status: "working" }).eq("id", deliverable.contract_id);

  revalidatePath(`/contracts/${deliverable.contract_id}`);
  return { success: "修正を依頼しました" };
});
