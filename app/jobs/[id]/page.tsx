import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProposalForm from "./ProposalForm";
import { acceptProposal } from "./actions";
import { EmptyState } from "@/components/EmptyState";
import { RankBadge } from "@/components/RankBadge";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: job } = await supabase
    .from("jobs")
    .select("*, profiles:client_id(id, handle, display_name, avatar_url, rating_avg, rating_count)")
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

  return (
    <div className="container-app max-w-4xl py-6 md:py-10">
      <Link href="/jobs" className="text-sm text-moai-primary hover:underline">← 一覧に戻る</Link>
      <div className="card mt-4">
        <span className="badge">{job.category}</span>
        <h1 className="mt-2 text-2xl font-bold">{job.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
          <span>投稿者: {job.profiles?.display_name}</span>
          <span>★ {Number(job.profiles?.rating_avg || 0).toFixed(1)} ({job.profiles?.rating_count})</span>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 pt-4">
          <Info label="予算" value={`¥${job.budget_min_jpy?.toLocaleString() ?? "-"} 〜 ¥${job.budget_max_jpy?.toLocaleString() ?? "-"}`} />
          <Info label="形態" value={job.budget_type === "fixed" ? "固定" : "時給"} />
          <Info label="締切" value={job.deadline ?? "-"} />
          <Info label="状態" value={job.status} />
        </div>
        <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">{job.description}</div>
        {job.skills?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.skills.map((s: string) => <span key={s} className="badge">{s}</span>)}
          </div>
        )}
      </div>

      {/* 応募フォーム or 自分の応募 */}
      {!isOwner && user && (
        <div className="mt-6">
          {myProposal ? (
            <div className="card">
              <h3 className="font-semibold">あなたの応募</h3>
              <p className="mt-2 text-sm whitespace-pre-wrap">{myProposal.cover_letter}</p>
              <div className="mt-2 text-sm text-slate-600">
                提案金額: ¥{myProposal.proposed_amount_jpy.toLocaleString()} / ステータス: {myProposal.status}
              </div>
            </div>
          ) : (
            <ProposalForm jobId={job.id} bankSetupDone={bankSetupDone} />
          )}
        </div>
      )}

      {!user && (
        <div className="card mt-6 text-center">
          <p className="text-sm text-slate-600 mb-3">応募するにはログインが必要です</p>
          <Link href={`/login?redirect=/jobs/${job.id}`} className="btn-primary">ログイン</Link>
        </div>
      )}

      {/* オーナー: 応募一覧 */}
      {isOwner && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-3">応募一覧 ({proposals?.length ?? 0})</h2>
          <div className="space-y-3">
            {proposals?.map((p: any) => (
              <div key={p.id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{p.profiles?.display_name}</span>
                      <RankBadge rank={p.profiles?.rank} size="xs" showLabel={false} />
                    </div>
                    <div className="text-xs text-slate-500">
                      ★ {Number(p.profiles?.rating_avg || 0).toFixed(1)} ({p.profiles?.rating_count})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-moai-primary">¥{p.proposed_amount_jpy.toLocaleString()}</div>
                    {p.proposed_days && <div className="text-xs text-slate-500">{p.proposed_days}日</div>}
                  </div>
                </div>
                <p className="mt-3 text-sm whitespace-pre-wrap">{p.cover_letter}</p>
                {p.status === "pending" && job.status === "open" && (
                  <form action={acceptProposal} className="mt-3">
                    <input type="hidden" name="proposal_id" value={p.id} />
                    <SubmitButton pendingLabel="承諾中…">この応募を承諾する</SubmitButton>
                  </form>
                )}
                {p.status !== "pending" && (
                  <span className="badge mt-3">{p.status}</span>
                )}
              </div>
            ))}
            {(!proposals || proposals.length === 0) && (
              <EmptyState icon="📭" title="まだ応募がありません" description="応募が届くと、ここに表示されます" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
