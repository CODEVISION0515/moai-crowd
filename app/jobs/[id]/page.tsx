import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProposalForm from "./ProposalForm";
import { acceptProposal } from "./actions";
import { EmptyState } from "@/components/EmptyState";
import { RankBadge } from "@/components/RankBadge";
import { Avatar } from "@/components/Avatar";
import { SubmitButton } from "@/components/SubmitButton";
import {
  formatCurrency,
  jobStatusLabel,
  jobStatusBadgeClass,
  proposalStatusLabel,
  proposalStatusBadgeClass,
} from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  web: "Web制作",
  design: "デザイン",
  writing: "ライティング",
  video: "動画・写真",
  ai: "AI・自動化",
  marketing: "マーケ・SNS",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400_000);
  if (days < 1) return "今日";
  if (days < 30) return `${days}日前`;
  return `${Math.floor(days / 30)}ヶ月前`;
}

export default async function JobDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: job } = await supabase
    .from("jobs")
    .select("*, profiles:client_id(id, handle, display_name, avatar_url, rating_avg, rating_count, verified_identity)")
    .eq("id", id)
    .single();

  if (!job) notFound();

  const isOwner = user?.id === job.client_id;

  // 応募一覧 (オーナー or 自分の応募のみRLSで絞られる)
  const { data: proposals } = await supabase
    .from("proposals")
    .select("*, profiles:worker_id(handle, display_name, avatar_url, rating_avg, rating_count, rank, crowd_role)")
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  const myProposal = proposals?.find((p: any) => p.worker_id === user?.id);

  // 応募時の口座登録状態チェック（応募者本人の場合のみ）
  let bankSetupDone = true;
  if (user && !isOwner && !myProposal) {
    const { data: me } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .maybeSingle();
    bankSetupDone = !!me?.stripe_account_id;
  }

  // 類似案件（同カテゴリ・スキル交差）
  const { data: similarJobs } = await supabase
    .from("jobs")
    .select("id, title, budget_min_jpy, budget_max_jpy, category, proposal_count")
    .eq("status", "open")
    .eq("category", job.category)
    .neq("id", job.id)
    .limit(4);

  const isOpen = job.status === "open";
  const proposalCount = proposals?.length ?? 0;

  return (
    <div className="container-wide py-6 md:py-8 pb-nav">
      {/* Breadcrumb */}
      <nav className="text-xs text-moai-muted mb-4 flex items-center gap-1.5" aria-label="パンくず">
        <Link href="/jobs" className="hover:text-moai-ink transition-colors">仕事を探す</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/jobs?category=${job.category}`} className="hover:text-moai-ink transition-colors">
          {CATEGORY_LABEL[job.category] ?? job.category}
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-moai-ink truncate max-w-[260px]">{job.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6">
        {/* ── MAIN ── */}
        <main className="min-w-0 space-y-6">
          {/* Header card */}
          <div className="card">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge">{CATEGORY_LABEL[job.category] ?? job.category}</span>
              {!isOpen && (
                <span className={`${jobStatusBadgeClass(job.status)} text-[10px]`}>
                  {jobStatusLabel(job.status)}
                </span>
              )}
              {Date.now() - new Date(job.created_at).getTime() < 86400_000 && (
                <span className="badge-new text-[10px]">NEW</span>
              )}
            </div>
            <h1 className="mt-3 text-xl md:text-2xl font-bold leading-snug">{job.title}</h1>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-moai-border pt-4">
              <Info label="予算" value={`${formatCurrency(job.budget_min_jpy ?? 0)} 〜 ${formatCurrency(job.budget_max_jpy ?? 0)}`} />
              <Info label="形態" value={job.budget_type === "fixed" ? "固定報酬" : "時給制"} />
              <Info label="締切" value={job.deadline ?? "未設定"} />
              <Info label="応募" value={`${proposalCount}件`} />
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="text-base font-bold mb-3">案件の詳細</h2>
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-moai-ink">
              {job.description}
            </div>
            {job.skills?.length > 0 && (
              <div className="mt-5 pt-5 border-t border-moai-border">
                <h3 className="text-xs font-semibold text-moai-muted uppercase tracking-wider mb-2">必要スキル</h3>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((s: string) => (
                    <Link
                      key={s}
                      href={`/jobs?skills=${encodeURIComponent(s)}`}
                      className="chip"
                    >
                      {s}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Owner: 応募一覧 */}
          {isOwner && (
            <div className="card">
              <h2 className="text-base font-bold mb-3">応募一覧 ({proposals?.length ?? 0})</h2>
              <div className="space-y-3">
                {proposals?.map((p: any) => (
                  <div key={p.id} className="border border-moai-border rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={p.profiles?.avatar_url} name={p.profiles?.display_name} size={36} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link href={`/profile/${p.profiles?.handle}`} className="font-semibold text-sm hover:text-moai-primary transition-colors truncate">
                              {p.profiles?.display_name}
                            </Link>
                            <RankBadge rank={p.profiles?.rank} size="xs" showLabel={false} />
                          </div>
                          <div className="text-xs text-moai-muted">
                            <span className="text-amber-500">★</span> {Number(p.profiles?.rating_avg || 0).toFixed(1)} ({p.profiles?.rating_count})
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-moai-primary">{formatCurrency(p.proposed_amount_jpy)}</div>
                        {p.proposed_days && <div className="text-xs text-moai-muted">{p.proposed_days}日</div>}
                      </div>
                    </div>
                    <p className="mt-3 text-sm whitespace-pre-wrap leading-relaxed">{p.cover_letter}</p>
                    {p.status === "pending" && job.status === "open" && (
                      <form action={acceptProposal} className="mt-3">
                        <input type="hidden" name="proposal_id" value={p.id} />
                        <SubmitButton variant="accent" size="sm" pendingLabel="承諾中…">この応募を承諾する</SubmitButton>
                      </form>
                    )}
                    {p.status !== "pending" && (
                      <span className={`${proposalStatusBadgeClass(p.status)} mt-3`}>
                        {proposalStatusLabel(p.status)}
                      </span>
                    )}
                  </div>
                ))}
                {(!proposals || proposals.length === 0) && (
                  <EmptyState icon="📭" title="まだ応募がありません" description="応募が届くと、ここに表示されます" />
                )}
              </div>
            </div>
          )}

          {/* Similar jobs */}
          {(similarJobs?.length ?? 0) > 0 && (
            <div className="card">
              <h2 className="text-base font-bold mb-3">関連する案件</h2>
              <div className="space-y-2">
                {similarJobs?.map((s: any) => (
                  <Link key={s.id} href={`/jobs/${s.id}`} className="block p-3 rounded-lg border border-moai-border hover:border-moai-primary hover:bg-moai-cloud/30 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium line-clamp-1">{s.title}</div>
                        <div className="text-[11px] text-moai-muted mt-0.5">応募 {s.proposal_count ?? 0}件</div>
                      </div>
                      <div className="text-sm font-bold text-moai-ink shrink-0">
                        {formatCurrency(s.budget_min_jpy ?? 0)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* ── RIGHT STICKY SIDEBAR ── */}
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] self-start space-y-4">
          {/* Apply CTA */}
          {!user && (
            <div className="card-flat border border-moai-primary/30 bg-gradient-card p-5 text-center">
              <h3 className="font-bold text-base">応募するにはログイン</h3>
              <p className="mt-1 text-xs text-moai-muted leading-relaxed">
                3分で会員登録。クレジットカード不要。
              </p>
              <Link
                href={`/login?redirect=/jobs/${job.id}`}
                className="mt-4 btn-accent btn-lg w-full"
              >
                ログインして応募
              </Link>
              <Link
                href={`/signup?redirect=/jobs/${job.id}`}
                className="mt-2 btn-outline btn-sm w-full"
              >
                新規登録（無料）
              </Link>
            </div>
          )}

          {!isOwner && user && (
            <div>
              {myProposal ? (
                <div className="card border-moai-primary/30 bg-moai-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-emerald-600 text-base">✓</span>
                    <h3 className="font-semibold text-sm">応募済み</h3>
                  </div>
                  <p className="text-xs whitespace-pre-wrap text-moai-muted leading-relaxed">{myProposal.cover_letter}</p>
                  <div className="mt-3 pt-3 border-t border-moai-border/60 flex items-center justify-between text-xs">
                    <span className="text-moai-muted">提案金額</span>
                    <span className="font-bold text-moai-ink">{formatCurrency(myProposal.proposed_amount_jpy)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-moai-muted">ステータス</span>
                    <span className={`${proposalStatusBadgeClass(myProposal.status)} text-[10px]`}>
                      {proposalStatusLabel(myProposal.status)}
                    </span>
                  </div>
                </div>
              ) : (
                <ProposalForm jobId={job.id} bankSetupDone={bankSetupDone} />
              )}
            </div>
          )}

          {isOwner && (
            <div className="card-flat border border-amber-300 bg-amber-50/40 p-4 text-center">
              <div className="text-xs font-semibold text-amber-800">あなたが投稿した案件</div>
              <div className="mt-1 text-[11px] text-amber-700/80">応募が届くと、左側に一覧表示されます</div>
            </div>
          )}

          {/* Client info */}
          <div className="card">
            <h3 className="text-xs font-semibold text-moai-muted uppercase tracking-wider mb-3">発注者</h3>
            <Link href={`/profile/${job.profiles?.handle}`} className="flex items-center gap-3 group">
              <Avatar src={job.profiles?.avatar_url} name={job.profiles?.display_name} size={48} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm group-hover:text-moai-primary transition-colors flex items-center gap-1.5">
                  <span className="truncate">{job.profiles?.display_name}</span>
                  {job.profiles?.verified_identity && <span title="本人確認済み" className="text-blue-500">✓</span>}
                </div>
                <div className="text-xs text-moai-muted">
                  <span className="text-amber-500">★</span> {Number(job.profiles?.rating_avg || 0).toFixed(1)} ({job.profiles?.rating_count}件)
                </div>
              </div>
            </Link>
            <div className="mt-3 pt-3 border-t border-moai-border space-y-1.5 text-xs text-moai-muted">
              <div className="flex justify-between">
                <span>掲載開始</span>
                <span className="text-moai-ink">{timeAgo(job.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>応募数</span>
                <span className="text-moai-ink font-medium">{proposalCount}件</span>
              </div>
            </div>
          </div>

          {/* Trust note */}
          <div className="card-flat bg-moai-cloud/40 p-4 text-[11px] text-moai-muted leading-relaxed">
            <div className="font-semibold text-moai-ink mb-1.5">🔒 安心のエスクロー決済</div>
            報酬は事前にエスクローで保管。検収完了後に受注者へ送金されます。
            <Link href="/how-it-works" className="block mt-2 text-moai-primary hover:underline">
              使い方を詳しく見る →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-moai-muted uppercase tracking-wider">{label}</div>
      <div className="mt-1 text-sm font-semibold text-moai-ink">{value}</div>
    </div>
  );
}
