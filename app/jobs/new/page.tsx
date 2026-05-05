import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { MoaiBadge } from "@/components/MoaiBadge";
import AIDraftPanel from "./AIDraftPanel";
import NewJobForm from "./NewJobForm";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ assignee?: string }>;
}) {
  const sp = await searchParams;
  const assigneeHandle = sp.assignee?.trim() || null;

  const sb = await createClient();
  const [{ data: categories }, assigneeRes] = await Promise.all([
    sb.from("categories").select("slug, label").order("sort_order"),
    assigneeHandle
      ? sb
          .from("profiles")
          .select("id, handle, display_name, avatar_url, tagline, crowd_role, moai_badge_display, cohort")
          .eq("handle", assigneeHandle)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const assignee: any = assigneeRes.data;

  return (
    <div className="container-wide py-6 md:py-8 pb-nav">
      {/* Page header */}
      <div className="max-w-3xl">
        <h1 className="text-xl md:text-2xl font-bold">案件を投稿する</h1>
        <p className="mt-1 text-xs md:text-sm text-moai-muted">
          公開後、マッチするワーカーから応募が届きます。手数料は発注者4%（業界最安級）。
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-6">
        {/* MAIN: Form */}
        <main className="min-w-0 max-w-3xl">
          {assignee && (
            <div className="card mb-4 border-moai-primary/30 bg-moai-primary/[0.03]">
              <div className="flex items-start gap-3">
                <Avatar src={assignee.avatar_url} name={assignee.display_name} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-moai-primary uppercase tracking-wider">
                    💼 この受注者に依頼したい
                  </div>
                  <div className="mt-0.5 font-semibold">{assignee.display_name}</div>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-moai-muted mt-0.5">
                    <span>@{assignee.handle}</span>
                    <MoaiBadge crowdRole={assignee.crowd_role} display={assignee.moai_badge_display} cohort={assignee.cohort} />
                  </div>
                  {assignee.tagline && <p className="mt-2 text-xs text-moai-muted line-clamp-2">{assignee.tagline}</p>}
                  <p className="mt-2 text-[11px] text-moai-muted">
                    案件公開後、<strong className="text-moai-ink">{assignee.display_name}</strong> さんに通知が届きます。本人が応募してくれたら、承諾して契約締結できます。
                  </p>
                </div>
              </div>
            </div>
          )}

          <NewJobForm
            categories={categories ?? []}
            assigneeHandle={assigneeHandle}
            assigneeDisplayName={assignee?.display_name ?? null}
          />
        </main>

        {/* RIGHT STICKY SIDEBAR */}
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] self-start space-y-4">
          {!assignee && <AIDraftPanel />}

          {/* Tips */}
          <div className="card-flat bg-moai-cloud/40 p-4">
            <h3 className="text-xs font-semibold text-moai-ink uppercase tracking-wider mb-2">📝 良い案件の書き方</h3>
            <ul className="space-y-1.5 text-[11px] text-moai-muted leading-relaxed">
              <li>・<strong className="text-moai-ink">目的</strong>を最初に書く（何のために作るか）</li>
              <li>・<strong className="text-moai-ink">対象ユーザー</strong>を明確に</li>
              <li>・<strong className="text-moai-ink">分量・納期</strong>を具体的に</li>
              <li>・<strong className="text-moai-ink">参考リンク</strong>を添付するとマッチ精度UP</li>
              <li>・<strong className="text-moai-ink">予算</strong>は相場帯を素直に提示</li>
            </ul>
          </div>

          {/* Search workers */}
          <div className="card-flat bg-white border border-moai-border p-4">
            <h3 className="text-xs font-semibold text-moai-ink uppercase tracking-wider mb-2">🎯 ワーカーから探す</h3>
            <p className="text-[11px] text-moai-muted mb-3 leading-relaxed">
              先にワーカーを選んで、本人に直接依頼することもできます。
            </p>
            <Link href="/workers" className="btn-outline btn-sm w-full">
              ワーカーを検索
            </Link>
          </div>

          {/* Pricing */}
          <div className="card-flat bg-white border border-moai-border p-4 text-[11px] text-moai-muted leading-relaxed">
            <h3 className="text-xs font-semibold text-moai-ink uppercase tracking-wider mb-2">💰 手数料</h3>
            <div className="flex justify-between mb-1">
              <span>発注者</span>
              <span className="font-bold text-moai-ink">4%</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>受注者</span>
              <span className="text-moai-ink">5〜15%</span>
            </div>
            <Link href="/pricing" className="text-moai-primary hover:underline">
              詳しい料金表 →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
