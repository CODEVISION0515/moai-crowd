import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeliverableForm from "./DeliverableForm";
import FundButton from "./FundButton";
import ReviewForm from "./ReviewForm";
import { approveDeliverable, requestRevision } from "./actions";
import { ToastForm } from "@/components/ToastForm";
import {
  formatCurrency,
  formatDateJP,
  contractStatusLabel,
  contractStatusColor,
  contractStatusStep,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type Counterparty = {
  handle: string | null;
  display_name: string | null;
} | null;

type DeliverableRow = {
  id: string;
  submitted_at: string;
  message: string;
  file_urls: string[] | null;
  review_status: "pending" | "approved" | "revision_requested";
  revision_note: string | null;
};

type TransactionRow = {
  id: string;
  kind: string;
  amount_jpy: number;
  note: string | null;
  created_at: string;
};

const STEP_LABELS = ["入金", "作業", "提出", "承認", "完了"];

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/login?redirect=/contracts/${id}`);

  const { data: contract } = await sb
    .from("contracts")
    .select(
      "*, jobs(id, title, description), client:client_id(handle, display_name), worker:worker_id(handle, display_name)",
    )
    .eq("id", id)
    .single();
  if (!contract) notFound();

  const isClient = contract.client_id === user.id;
  const isWorker = contract.worker_id === user.id;
  if (!isClient && !isWorker) notFound();

  const [
    { data: deliverables },
    { data: existingReview },
    { data: thread },
    { data: recentTxs },
  ] = await Promise.all([
    sb
      .from("deliverables")
      .select("*")
      .eq("contract_id", id)
      .order("submitted_at", { ascending: false })
      .returns<DeliverableRow[]>(),
    sb
      .from("reviews")
      .select("id")
      .eq("contract_id", id)
      .eq("reviewer_id", user.id)
      .maybeSingle(),
    sb
      .from("threads")
      .select("id")
      .eq("job_id", contract.job_id)
      .eq("client_id", contract.client_id)
      .eq("worker_id", contract.worker_id)
      .maybeSingle(),
    sb
      .from("transactions")
      .select("id, kind, amount_jpy, note, created_at")
      .eq("contract_id", id)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<TransactionRow[]>(),
  ]);

  const counterparty: Counterparty = isClient
    ? (contract.worker as Counterparty)
    : (contract.client as Counterparty);
  const counterpartyRole = isClient ? "受注者" : "発注者";

  const step = contractStatusStep(contract.status, contract.funded_at);
  const isInBranch = contract.status === "disputed" || contract.status === "canceled";

  // 直近の決済失敗（承認後に新たな成功イベントが入っていない場合のみ表示）
  const lastFailure = (recentTxs ?? []).find(
    (t) => t.kind === "charge_failed" || t.kind === "transfer_failed",
  );
  const lastSuccess = (recentTxs ?? []).find(
    (t) => t.kind === "escrow_fund" || t.kind === "escrow_release",
  );
  const showFailureBanner =
    lastFailure &&
    (!lastSuccess ||
      new Date(lastFailure.created_at).getTime() > new Date(lastSuccess.created_at).getTime());

  const pendingDeliverable = (deliverables ?? []).find((d) => d.review_status === "pending");
  const needsFunding = isClient && contract.status === "funded" && !contract.funded_at;
  const needsSubmission =
    isWorker && ["funded", "working"].includes(contract.status) && !!contract.funded_at;
  const needsApproval =
    isClient && !!pendingDeliverable && contract.status !== "released";
  const needsReview = contract.status === "released" && !existingReview;

  return (
    <div className="container-app max-w-3xl py-6 md:py-10 space-y-5">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-moai-primary hover:underline">
        ← ダッシュボードに戻る
      </Link>

      {/* ── 概要カード ── */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${contractStatusColor(contract.status)}`}
            >
              {contractStatusLabel(contract.status)}
            </span>
            <h1 className="mt-2 text-xl md:text-2xl font-bold leading-snug">
              {contract.jobs?.title ?? "(案件タイトルなし)"}
            </h1>
            <div className="mt-2 text-sm text-moai-muted">
              {counterpartyRole}:{" "}
              {counterparty?.handle ? (
                <Link href={`/profile/${counterparty.handle}`} className="text-moai-ink font-medium hover:underline">
                  {counterparty.display_name ?? counterparty.handle}
                </Link>
              ) : (
                <span className="text-moai-ink font-medium">{counterparty?.display_name ?? "—"}</span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-moai-muted">契約金額</div>
            <div className="text-xl md:text-2xl font-bold text-moai-primary">
              {formatCurrency(contract.amount_jpy)}
            </div>
            <div className="mt-1 text-[11px] text-moai-muted leading-tight">
              手数料 {formatCurrency(contract.platform_fee_jpy)}
              <br />
              受取 {formatCurrency(contract.worker_payout_jpy)}
            </div>
          </div>
        </div>

        {/* 進捗ステッパー */}
        {!isInBranch && (
          <div className="mt-5 pt-4 border-t border-moai-border">
            <ol className="flex items-center justify-between gap-1" aria-label="契約の進捗">
              {STEP_LABELS.map((label, i) => {
                const reached = step >= i;
                const isCurrent = step === i;
                return (
                  <li
                    key={label}
                    className="flex flex-col items-center flex-1 min-w-0"
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    <div className="flex items-center w-full">
                      {i > 0 && (
                        <div className={`h-0.5 flex-1 ${step >= i ? "bg-moai-primary" : "bg-moai-border"}`} />
                      )}
                      <span
                        className={`mx-1 inline-flex items-center justify-center h-7 w-7 rounded-full text-[11px] font-semibold transition-colors ${
                          reached
                            ? "bg-moai-primary text-white"
                            : "bg-moai-cloud text-moai-muted"
                        }`}
                        aria-hidden="true"
                      >
                        {reached && !isCurrent ? "✓" : i + 1}
                      </span>
                      {i < STEP_LABELS.length - 1 && (
                        <div className={`h-0.5 flex-1 ${step > i ? "bg-moai-primary" : "bg-moai-border"}`} />
                      )}
                    </div>
                    <span
                      className={`mt-1 text-[10px] md:text-xs text-center ${
                        reached ? "text-moai-ink font-medium" : "text-moai-muted"
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>

      {/* ── 決済失敗バナー ── */}
      {showFailureBanner && lastFailure && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0" aria-hidden="true">⚠️</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-red-900">
                {lastFailure.kind === "charge_failed" ? "支払いが失敗しました" : "送金処理が失敗しました"}
              </h3>
              <p className="mt-1 text-sm text-red-800">
                {lastFailure.note ?? "原因不明のエラーです"}
              </p>
              <p className="mt-2 text-xs text-red-700">
                {formatDateJP(lastFailure.created_at)} に発生 ・ 管理者に通知済みです
              </p>
              {lastFailure.kind === "charge_failed" && isClient && (
                <div className="mt-3">
                  <FundButton contractId={id} amount={contract.amount_jpy} retryMode />
                </div>
              )}
              {lastFailure.kind === "transfer_failed" && (
                <p className="mt-2 text-xs text-red-700">
                  受注者の振込先口座の設定が完了し次第、運営から再送金します。
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 次にやること（Action Card） ── */}
      {needsFunding && (
        <ActionCard
          icon="💳"
          title="作業開始前にエスクローへ入金してください"
          description="入金された報酬は MOAI が一時的に預かります。成果物を承認したタイミングで受注者へ自動送金されます。納品物に満足できなかった場合は修正依頼または返金が可能です。"
        >
          <FundButton contractId={id} amount={contract.amount_jpy} />
        </ActionCard>
      )}

      {needsSubmission && (
        <ActionCard
          icon="📤"
          title="成果物を提出する番です"
          description="作業内容と納品物を発注者に送信しましょう。提出後は発注者が承認すると、報酬がご自身の Stripe 口座へ送金されます。"
        >
          <DeliverableForm contractId={id} />
        </ActionCard>
      )}

      {needsApproval && pendingDeliverable && (
        <ActionCard
          icon="✅"
          title="成果物が提出されました"
          description="内容を確認して、問題なければ「承認して支払う」を押してください。受注者へ即座に報酬が送金されます。修正してほしい点があれば修正依頼へ。"
        />
      )}

      {needsReview && (
        <ActionCard
          icon="⭐"
          title="お互いを評価しましょう"
          description="評価コメントは相手のプロフィールに表示されます。次の取引にもつながる大事なステップです。"
        >
          <ReviewForm
            contractId={id}
            revieweeId={isClient ? contract.worker_id : contract.client_id}
          />
        </ActionCard>
      )}

      {/* ── 補助導線 ── */}
      <div className="flex flex-wrap gap-2">
        {thread?.id && (
          <Link href={`/messages/${thread.id}`} className="btn-outline btn-sm">
            💬 {counterpartyRole}とDMする
          </Link>
        )}
        {contract.jobs?.id && (
          <Link href={`/jobs/${contract.jobs.id}`} className="btn-outline btn-sm">
            📄 案件詳細を見る
          </Link>
        )}
        {isClient && contract.status === "released" && contract.jobs?.id && (
          <Link
            href={`/invoices/new?contract=${contract.id}`}
            className="btn-outline btn-sm"
          >
            🧾 請求書を発行
          </Link>
        )}
      </div>

      {/* ── 提出履歴 ── */}
      {deliverables && deliverables.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title">提出履歴</h2>
          <div className="space-y-3">
            {deliverables.map((d) => (
              <article key={d.id} className="card">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="text-xs text-moai-muted">{formatDateJP(d.submitted_at)}</div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      d.review_status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : d.review_status === "revision_requested"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {d.review_status === "approved"
                      ? "✓ 承認済み"
                      : d.review_status === "revision_requested"
                        ? "修正依頼中"
                        : "確認待ち"}
                  </span>
                </div>
                <p className="mt-3 text-sm whitespace-pre-wrap leading-relaxed">{d.message}</p>
                {d.file_urls && d.file_urls.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {d.file_urls.map((url, i) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-moai-primary hover:underline inline-flex items-center gap-1"
                        >
                          📎 添付 {i + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {d.revision_note && (
                  <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                    <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                      修正依頼
                    </div>
                    <p className="whitespace-pre-wrap">{d.revision_note}</p>
                  </div>
                )}

                {isClient && d.review_status === "pending" && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <ToastForm action={approveDeliverable} className="sm:flex-1">
                      <input type="hidden" name="deliverable_id" value={d.id} />
                      <button type="submit" className="btn-primary w-full">
                        承認して支払う
                      </button>
                    </ToastForm>
                    <details className="sm:flex-1">
                      <summary className="btn-outline cursor-pointer w-full text-center">
                        修正を依頼
                      </summary>
                      <ToastForm action={requestRevision} className="mt-2 space-y-2">
                        <input type="hidden" name="deliverable_id" value={d.id} />
                        <textarea
                          name="revision_note"
                          required
                          rows={3}
                          className="input"
                          placeholder="修正してほしい点を具体的に書きましょう"
                        />
                        <button type="submit" className="btn-outline w-full">
                          修正を依頼する
                        </button>
                      </ToastForm>
                    </details>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── 評価セクション（既にレビュー済みなら情報のみ） ── */}
      {contract.status === "released" && existingReview && (
        <div className="card bg-emerald-50/50 border-emerald-200">
          <p className="text-sm text-emerald-900">
            ✓ 評価を送信しました。ご利用ありがとうございます。
          </p>
        </div>
      )}
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="card border-moai-primary/30 bg-moai-primary/[0.03]">
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0" aria-hidden="true">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-moai-primary uppercase tracking-wider">
            次にやること
          </div>
          <h2 className="mt-0.5 font-bold text-base md:text-lg">{title}</h2>
          <p className="mt-1.5 text-sm text-moai-muted leading-relaxed">{description}</p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </section>
  );
}
