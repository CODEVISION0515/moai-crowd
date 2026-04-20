"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { requireAdmin } from "@/lib/auth";
import { parseFormData } from "@/lib/validations";
import { refundContractSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/actions";

export async function refundContract(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const parsed = parseFormData(refundContractSchema, formData);
  if (!parsed.success) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const { contract_id, reason } = parsed.data;
  const admin = createAdminClient();

  const { data: contract } = await admin
    .from("contracts")
    .select("id, status, amount_jpy, stripe_payment_intent_id, client_id, worker_id, job_id, refunded_at")
    .eq("id", contract_id)
    .single();

  if (!contract) return { error: "契約が見つかりません" };
  if (contract.refunded_at) return { error: "この契約は既に返金済みです" };
  if (contract.status === "released") {
    return { error: "既に支払い完了済みの契約は返金できません（受注者から個別に回収してください）" };
  }
  if (!["funded", "working", "submitted", "disputed"].includes(contract.status)) {
    return { error: `このステータス（${contract.status}）では返金できません` };
  }

  // Stripe Refund 実行
  let refundId: string | null = null;
  if (contract.stripe_payment_intent_id) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: contract.stripe_payment_intent_id,
        reason: "requested_by_customer",
        metadata: {
          contract_id,
          admin_id: user.id,
          reason,
        },
      });
      refundId = refund.id;
    } catch (e: any) {
      return { error: `Stripe返金失敗: ${e?.message ?? "unknown"}` };
    }
  }

  // 契約ステータス更新
  const now = new Date().toISOString();
  await admin.from("contracts").update({
    status: "refunded",
    refunded_at: now,
    refund_reason: reason,
    refunded_by: user.id,
  }).eq("id", contract_id);

  // トランザクション記録
  await admin.from("transactions").insert({
    contract_id,
    kind: "refund",
    amount_jpy: contract.amount_jpy,
    stripe_ref: refundId,
    note: `管理者返金: ${reason}`,
  });

  // 案件ステータスを open に戻す（再募集可能に）
  await admin.from("jobs").update({ status: "open" }).eq("id", contract.job_id);

  // 監査ログ
  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "contract.refund",
    target_kind: "contract",
    target_id: contract_id,
    detail: { reason, refund_id: refundId, amount_jpy: contract.amount_jpy },
  });

  // 当事者へ通知
  await admin.from("notifications").insert([
    {
      user_id: contract.client_id,
      kind: "contract_funded",
      title: "契約が返金されました",
      body: `理由: ${reason}`,
      link: `/contracts/${contract_id}`,
    },
    {
      user_id: contract.worker_id,
      kind: "contract_funded",
      title: "契約が返金されました",
      body: `理由: ${reason}`,
      link: `/contracts/${contract_id}`,
    },
  ]);

  revalidatePath(`/admin/contracts/${contract_id}`);
  revalidatePath("/admin/contracts");
  return { success: refundId ? `返金完了 (refund_id: ${refundId})` : "返金記録を保存しました（Stripe PI未紐付け）" };
}
