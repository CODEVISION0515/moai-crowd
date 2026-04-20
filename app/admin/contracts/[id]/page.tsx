import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { ToastForm } from "@/components/ToastForm";
import { FieldError } from "@/components/FieldError";
import { formatCurrency, formatDateJP } from "@/lib/utils";
import { refundContract } from "./actions";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  escrow_fund: "エスクロー入金",
  escrow_release: "受注者への支払い",
  platform_fee: "手数料",
  refund: "返金",
  transfer_failed: "Transfer失敗",
  charge_failed: "支払い失敗",
};

export default async function AdminContractDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const [contractRes, txsRes] = await Promise.all([
    admin
      .from("contracts")
      .select("*, jobs(id, title), client:client_id(id, display_name, handle), worker:worker_id(id, display_name, handle, stripe_account_id)")
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("transactions")
      .select("*")
      .eq("contract_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const contract: any = contractRes.data;
  const txs = txsRes.data;
  if (!contract) notFound();

  const canRefund =
    !contract.refunded_at &&
    ["funded", "working", "submitted", "disputed"].includes(contract.status);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/contracts" className="text-sm text-moai-primary hover:underline">← 契約一覧に戻る</Link>
      </div>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge">{contract.status}</span>
              {contract.transfer_failed_at && <span className="badge-coral">⚠️ Transfer失敗</span>}
              {contract.refunded_at && <span className="badge-coral">返金済</span>}
            </div>
            <h1 className="mt-2 text-2xl font-bold">
              <Link href={`/jobs/${contract.jobs?.id}`} className="hover:text-moai-primary">
                {contract.jobs?.title}
              </Link>
            </h1>
            <div className="mt-1 text-xs text-moai-muted">契約ID: {contract.id}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-moai-muted">契約金額</div>
            <div className="text-2xl font-bold">{formatCurrency(contract.amount_jpy)}</div>
          </div>
        </div>
      </div>

      {/* 金額内訳 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <div className="stat-card-label">受注者支払い</div>
          <div className="stat-card-value text-base">{formatCurrency(contract.worker_payout_jpy)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">プラットフォーム手数料</div>
          <div className="stat-card-value text-base">{formatCurrency(contract.platform_fee_jpy)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">ステータス</div>
          <div className="stat-card-value text-base">{contract.status}</div>
        </div>
      </div>

      {/* 当事者 */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="section-title mb-2">発注者</h3>
          <Link href={`/profile/${contract.client?.handle}`} className="font-semibold hover:text-moai-primary">
            {contract.client?.display_name}
          </Link>
          <div className="text-xs text-moai-muted">@{contract.client?.handle}</div>
        </div>
        <div className="card">
          <h3 className="section-title mb-2">受注者</h3>
          <Link href={`/profile/${contract.worker?.handle}`} className="font-semibold hover:text-moai-primary">
            {contract.worker?.display_name}
          </Link>
          <div className="text-xs text-moai-muted">@{contract.worker?.handle}</div>
          <div className="mt-2 text-xs">
            Stripe Connect:{" "}
            {contract.worker?.stripe_account_id ? (
              <span className="badge-success">設定済</span>
            ) : (
              <span className="badge-coral">未設定</span>
            )}
          </div>
        </div>
      </div>

      {/* Stripe情報 */}
      <div className="card">
        <h3 className="section-title mb-3">Stripe 情報</h3>
        <dl className="text-sm grid grid-cols-[120px_1fr] gap-y-2">
          <dt className="text-moai-muted">Payment Intent</dt>
          <dd className="font-mono text-xs break-all">{contract.stripe_payment_intent_id ?? "-"}</dd>
          <dt className="text-moai-muted">入金日時</dt>
          <dd>{contract.funded_at ? formatDateJP(contract.funded_at) : "-"}</dd>
          <dt className="text-moai-muted">送金日時</dt>
          <dd>{contract.released_at ? formatDateJP(contract.released_at) : "-"}</dd>
          <dt className="text-moai-muted">返金日時</dt>
          <dd>{contract.refunded_at ? formatDateJP(contract.refunded_at) : "-"}</dd>
          {contract.transfer_failed_at && (
            <>
              <dt className="text-moai-muted">Transfer失敗</dt>
              <dd className="text-red-600">
                {formatDateJP(contract.transfer_failed_at)}
                <div className="text-xs mt-0.5">{contract.transfer_failure_reason}</div>
              </dd>
            </>
          )}
          {contract.refund_reason && (
            <>
              <dt className="text-moai-muted">返金理由</dt>
              <dd>{contract.refund_reason}</dd>
            </>
          )}
        </dl>
      </div>

      {/* トランザクション履歴 */}
      <div>
        <h3 className="section-title mb-3">取引履歴 ({txs?.length ?? 0})</h3>
        {txs && txs.length > 0 ? (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th scope="col" className="p-3">日時</th>
                  <th scope="col" className="p-3">種別</th>
                  <th scope="col" className="p-3 text-right">金額</th>
                  <th scope="col" className="p-3">Stripe参照</th>
                  <th scope="col" className="p-3">備考</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t: any) => (
                  <tr key={t.id} className="border-t border-slate-200">
                    <td className="p-3 text-xs text-slate-500 whitespace-nowrap">{formatDateJP(t.created_at)}</td>
                    <td className="p-3"><span className="badge">{KIND_LABELS[t.kind] ?? t.kind}</span></td>
                    <td className="p-3 text-right font-semibold whitespace-nowrap">{formatCurrency(t.amount_jpy)}</td>
                    <td className="p-3 font-mono text-xs break-all">{t.stripe_ref ?? "-"}</td>
                    <td className="p-3 text-xs text-slate-500">{t.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center text-sm text-moai-muted py-6">取引履歴はありません</div>
        )}
      </div>

      {/* 返金アクション */}
      {canRefund && (
        <div className="card border-red-200 bg-red-50/50">
          <h3 className="font-semibold text-red-800 mb-2">⚠️ 返金処理</h3>
          <p className="text-sm text-red-700 mb-3">
            Stripeから契約金額 <strong>{formatCurrency(contract.amount_jpy)}</strong> を発注者に返金します。
            ステータスは <code>refunded</code> に、関連案件は <code>open</code> に戻されます。
          </p>
          <ToastForm action={refundContract} className="space-y-3" noValidate>
            {({ fieldErrors }) => (
              <>
                <input type="hidden" name="contract_id" value={contract.id} />
                <div>
                  <label htmlFor="reason" className="label">返金理由 <span className="text-red-500">*</span></label>
                  <textarea
                    id="reason"
                    name="reason"
                    required
                    rows={3}
                    maxLength={500}
                    className={`input ${fieldErrors?.reason ? "input-error" : ""}`}
                    placeholder="例: クライアント都合によるキャンセル、紛争解決のため等"
                    aria-invalid={fieldErrors?.reason ? "true" : undefined}
                  />
                  <FieldError errors={fieldErrors} name="reason" />
                </div>
                <button className="btn-danger">返金を実行する</button>
              </>
            )}
          </ToastForm>
        </div>
      )}
    </div>
  );
}
