import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeliverableForm from "./DeliverableForm";
import FundButton from "./FundButton";
import ReviewForm from "./ReviewForm";
import { approveDeliverable, requestRevision } from "./actions";
import { ToastForm } from "@/components/ToastForm";
import { formatDateJP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/login?redirect=/contracts/${id}`);

  const { data: contract } = await sb
    .from("contracts")
    .select("*, jobs(id, title, description), client:client_id(handle, display_name), worker:worker_id(handle, display_name)")
    .eq("id", id)
    .single();
  if (!contract) notFound();

  const isClient = contract.client_id === user.id;
  const isWorker = contract.worker_id === user.id;
  if (!isClient && !isWorker) notFound();

  const { data: deliverables } = await sb
    .from("deliverables")
    .select("*")
    .eq("contract_id", id)
    .order("submitted_at", { ascending: false });

  const { data: existingReview } = await sb
    .from("reviews")
    .select("id")
    .eq("contract_id", id)
    .eq("reviewer_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-moai-primary hover:underline">← ダッシュボードに戻る</Link>

      <div className="card mt-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="badge">{contract.status}</span>
            <h1 className="mt-2 text-2xl font-bold">{contract.jobs?.title}</h1>
            <div className="mt-1 text-sm text-slate-600">
              発注: {contract.client?.display_name} / 受注: {contract.worker?.display_name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">契約金額</div>
            <div className="text-xl font-bold text-moai-primary">¥{contract.amount_jpy.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1">
              手数料 ¥{contract.platform_fee_jpy.toLocaleString()} / 受取 ¥{contract.worker_payout_jpy.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* エスクロー入金ボタン */}
      {isClient && contract.status === "funded" && !contract.funded_at && (
        <div className="card mt-4">
          <h3 className="font-semibold">エスクローに入金する</h3>
          <p className="text-sm text-slate-600 mt-1">
            作業開始前に報酬を仮預かりします。承認時に受注者へ支払われます。
          </p>
          <FundButton contractId={id} />
        </div>
      )}

      {/* 成果物提出 (受注者) */}
      {isWorker && ["funded", "working"].includes(contract.status) && (
        <div className="mt-6">
          <DeliverableForm contractId={id} />
        </div>
      )}

      {/* 成果物一覧 */}
      {deliverables && deliverables.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">提出履歴</h2>
          <div className="space-y-3">
            {deliverables.map((d) => (
              <div key={d.id} className="card">
                <div className="flex justify-between items-start">
                  <div className="text-xs text-slate-500">
                    {formatDateJP(d.submitted_at)}
                  </div>
                  <span className="badge">{d.review_status}</span>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{d.message}</p>
                {d.file_urls?.length > 0 && (
                  <ul className="mt-2 text-sm space-y-1">
                    {d.file_urls.map((url: string, i: number) => (
                      <li key={i}>
                        <a href={url} target="_blank" className="text-moai-primary hover:underline">
                          📎 添付 {i + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {d.revision_note && (
                  <div className="mt-2 rounded-md bg-amber-50 p-2 text-sm text-amber-900">
                    修正依頼: {d.revision_note}
                  </div>
                )}

                {isClient && d.review_status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <ToastForm action={approveDeliverable}>
                      <input type="hidden" name="deliverable_id" value={d.id} />
                      <button className="btn-primary">承認して支払う</button>
                    </ToastForm>
                    <details className="flex-1">
                      <summary className="btn-outline cursor-pointer">修正依頼</summary>
                      <ToastForm action={requestRevision} className="mt-2 space-y-2">
                        <input type="hidden" name="deliverable_id" value={d.id} />
                        <textarea name="revision_note" required rows={3} className="input" placeholder="修正してほしい点を具体的に" />
                        <button className="btn-outline w-full">修正を依頼する</button>
                      </ToastForm>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* レビュー */}
      {contract.status === "released" && !existingReview && (
        <div className="mt-8">
          <ReviewForm contractId={id} revieweeId={isClient ? contract.worker_id : contract.client_id} />
        </div>
      )}
    </div>
  );
}
