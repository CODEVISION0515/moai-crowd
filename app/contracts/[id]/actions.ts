"use server";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";
import { parseFormData, approveDeliverableSchema, requestRevisionSchema } from "@/lib/validations";

/**
 * 成果物を承認してエスクロー解放
 * 旧実装: fetch with Cookie:"" → 401失敗するバグを修正
 * 新実装: createAdminClient で直接 release 処理を実行
 */
export async function approveDeliverable(formData: FormData) {
  const { sb, user } = await requireUser();
  const parsed = parseFormData(approveDeliverableSchema, formData);
  if (!parsed.success) return;
  const { deliverable_id } = parsed.data;

  // 成果物とその契約を取得
  const { data: deliverable } = await sb
    .from("deliverables")
    .select("contract_id")
    .eq("id", deliverable_id)
    .single();
  if (!deliverable) return;

  const contractId = deliverable.contract_id;

  // 成果物を approved に更新
  await sb.from("deliverables").update({
    review_status: "approved",
    reviewed_at: new Date().toISOString(),
  }).eq("id", deliverable_id);

  // Admin クライアントでエスクロー解放（RLS をバイパス）
  const admin = createAdminClient();

  const { data: contract } = await admin
    .from("contracts")
    .select("*")
    .eq("id", contractId)
    .single();
  if (!contract || contract.client_id !== user.id) return;

  // 受注者の Stripe Connect アカウント取得
  const { data: worker } = await admin
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", contract.worker_id)
    .single();

  // Stripe Transfer
  let transferRef: string | null = null;
  if (worker?.stripe_account_id && contract.stripe_payment_intent_id) {
    try {
      const transfer = await stripe.transfers.create({
        amount: contract.worker_payout_jpy,
        currency: "jpy",
        destination: worker.stripe_account_id,
        metadata: { contract_id: contractId },
      });
      transferRef = transfer.id;
    } catch {
      // Transfer 失敗してもステータスは更新する（手動対応用）
    }
  }

  // 契約ステータス更新
  await admin.from("contracts").update({
    status: "released",
    released_at: new Date().toISOString(),
  }).eq("id", contractId);

  // 取引履歴記録
  await admin.from("transactions").insert([
    { contract_id: contractId, kind: "escrow_release", amount_jpy: contract.worker_payout_jpy, stripe_ref: transferRef, note: "受注者への支払い" },
    { contract_id: contractId, kind: "platform_fee", amount_jpy: contract.platform_fee_jpy, note: "プラットフォーム手数料" },
  ]);

  // 案件完了
  await admin.from("jobs").update({ status: "completed" }).eq("id", contract.job_id);

  revalidatePath(`/contracts/${contractId}`);
}

export async function requestRevision(formData: FormData) {
  const { sb } = await requireUser();
  const parsed = parseFormData(requestRevisionSchema, formData);
  if (!parsed.success) return;
  const { deliverable_id, revision_note } = parsed.data;

  // 成果物の contract_id を取得
  const { data: deliverable } = await sb
    .from("deliverables")
    .select("contract_id")
    .eq("id", deliverable_id)
    .single();
  if (!deliverable) return;

  await sb.from("deliverables").update({
    review_status: "revision_requested",
    reviewed_at: new Date().toISOString(),
    revision_note,
  }).eq("id", deliverable_id);

  await sb.from("contracts").update({ status: "working" }).eq("id", deliverable.contract_id);

  revalidatePath(`/contracts/${deliverable.contract_id}`);
}
