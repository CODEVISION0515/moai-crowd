import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: jobs }, { data: workers }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, category, budget_min_jpy, budget_max_jpy, proposal_count, created_at, profiles:client_id(display_name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("profiles")
      .select("id, handle, display_name, tagline, avatar_url, skills, rating_avg, rating_count, level")
      .eq("is_worker", true)
      .eq("is_suspended", false)
      .gte("profile_completion", 30)
      .order("rating_avg", { ascending: false })
      .limit(6),
  ]);

  return (
    <>
      {/* Hero — ミニマル */}
      <section className="border-b border-moai-border">
        <div className="container-app py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight">
              仲間と創る、<br />仕事のマッチング。
            </h1>
            <p className="mt-4 text-lg text-moai-muted leading-relaxed">
              MOAIコミュニティ発のクラウドソーシング。<br className="hidden sm:block" />
              手数料は業界の半分以下。受注者の手取りを守ります。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link href="/jobs" className="btn-primary btn-lg">案件を探す</Link>
                  <Link href="/jobs/new" className="btn-outline btn-lg">案件を投稿</Link>
                </>
              ) : (
                <>
                  <Link href="/signup" className="btn-primary btn-lg">無料で始める</Link>
                  <Link href="/jobs" className="btn-outline btn-lg">案件を見る</Link>
                </>
              )}
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-moai-muted">
              <span>手数料 10%</span>
              <span className="text-moai-border">|</span>
              <span>エスクロー決済</span>
              <span className="text-moai-border">|</span>
              <span>AI機能 無料</span>
            </div>
          </div>
        </div>
      </section>

      {/* カテゴリ */}
      <section className="container-app py-12">
        <h2 className="section-title mb-4">カテゴリ</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/jobs?category=${c.slug}`}
              className="card-hover text-center py-4">
              <div className="text-sm font-medium">{c.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* 新着案件 */}
      <section className="bg-moai-cloud border-y border-moai-border">
        <div className="container-app py-12">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="section-title">新着案件</h2>
            <Link href="/jobs" className="text-sm text-moai-primary hover:underline">すべて見る</Link>
          </div>
          {jobs && jobs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {jobs.map((j: any) => (
                <Link key={j.id} href={`/jobs/${j.id}`} className="card-hover group flex flex-col">
                  <div className="badge self-start">{j.category}</div>
                  <h3 className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-moai-primary transition-colors">{j.title}</h3>
                  <div className="mt-auto pt-3 flex items-end justify-between">
                    <div className="text-sm font-semibold">{formatCurrency(j.budget_min_jpy)}</div>
                    <div className="text-xs text-moai-muted">応募 {j.proposal_count}件</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState message="まだ案件がありません" actionHref="/jobs/new" actionLabel="最初の案件を投稿する" />
          )}
        </div>
      </section>

      {/* メンバー */}
      <section className="container-app py-12">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="section-title">メンバー</h2>
          <Link href="/workers" className="text-sm text-moai-primary hover:underline">もっと見る</Link>
        </div>
        {workers && workers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {workers.map((w: any) => (
              <Link key={w.id} href={`/profile/${w.handle}`} className="card-hover">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-sm font-medium text-moai-muted shrink-0">
                    {w.avatar_url ? <img src={w.avatar_url} alt="" className="h-full w-full object-cover" /> : (w.display_name?.[0] ?? "?")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{w.display_name}</div>
                    <div className="text-xs text-moai-muted">{Number(w.rating_avg).toFixed(1)} · Lv.{w.level ?? 1}</div>
                  </div>
                </div>
                {w.tagline && <p className="mt-2 text-xs text-moai-muted line-clamp-2">{w.tagline}</p>}
                {w.skills?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {w.skills.slice(0, 3).map((s: string) => <span key={s} className="badge text-xs">{s}</span>)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState message="メンバー募集中" />
        )}
      </section>

      {/* 使い方 */}
      <section className="border-t border-moai-border">
        <div className="container-app py-16">
          <h2 className="section-title text-center mb-8">使い方</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-moai-cloud text-sm font-semibold text-moai-muted mb-3">{i + 1}</div>
                <h3 className="font-medium text-sm">{s.title}</h3>
                <p className="mt-1 text-xs text-moai-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="border-t border-moai-border bg-moai-cloud">
          <div className="container-app py-16 text-center">
            <h2 className="text-xl font-semibold">始めてみませんか？</h2>
            <p className="mt-2 text-sm text-moai-muted">登録は無料。手数料は業界の半額以下。</p>
            <Link href="/signup" className="mt-6 inline-flex btn-primary btn-lg">
              無料で始める
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

const CATEGORIES = [
  { slug: "web", label: "Web制作" },
  { slug: "design", label: "デザイン" },
  { slug: "writing", label: "ライティング" },
  { slug: "video", label: "動画編集" },
  { slug: "ai", label: "AI・自動化" },
  { slug: "marketing", label: "マーケ" },
];

const STEPS = [
  { title: "登録", text: "メールアドレスで無料登録。プロフィールはAIが添削します。" },
  { title: "マッチング", text: "案件投稿か応募。AIがピッタリの相手を見つけてくれます。" },
  { title: "取引・評価", text: "エスクローで安心取引。完了後にお互いをレビュー。" },
];

function EmptyState({ message, actionHref, actionLabel }: { message: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="card text-center py-10">
      <p className="text-sm text-moai-muted">{message}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="mt-3 inline-flex btn-primary btn-sm">{actionLabel}</Link>
      )}
    </div>
  );
}
