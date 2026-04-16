import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: jobs }, { data: workers }, { count: jobCount }, { count: userCount }] = await Promise.all([
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
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_suspended", false),
  ]);

  const totalJobs = jobCount ?? 0;
  const totalUsers = userCount ?? 0;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-hero-light pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-moai-primary/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

        <div className="container-app relative py-16 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 badge-accent px-3 py-1 rounded-full mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-moai-primary animate-pulse-dot" />
              <span className="text-xs font-semibold">手数料 10% — 業界最安クラス</span>
            </div>

            <h1 className="text-display-md md:text-display-lg">
              仲間と創る、<br />仕事のマッチング。
            </h1>
            <p className="mt-5 text-lg text-moai-muted leading-relaxed max-w-lg">
              MOAIコミュニティ発のクラウドソーシング。<br className="hidden sm:block" />
              受注者の手取りを最大化する、新しいプラットフォーム。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link href="/jobs" className="btn-accent btn-lg">案件を探す</Link>
                  <Link href="/jobs/new" className="btn-outline btn-lg">案件を投稿</Link>
                </>
              ) : (
                <>
                  <Link href="/signup" className="btn-accent btn-lg">
                    無料で始める
                    <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link href="/jobs" className="btn-outline btn-lg">案件を見る</Link>
                </>
              )}
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-moai-muted">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-moai-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                エスクロー決済
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-moai-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI機能搭載
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-moai-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                コミュニティ運営
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-moai-border bg-white">
        <div className="container-app py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <StatItem value={`${totalJobs}+`} label="累計案件数" />
            <StatItem value={`${totalUsers}+`} label="登録メンバー" />
            <StatItem value="10%" label="手数料" accent />
            <StatItem value="AI" label="無料で使える" />
          </div>
        </div>
      </section>

      {/* ── カテゴリ ── */}
      <section className="container-app py-12 md:py-16">
        <div className="section-header">
          <h2 className="section-title">カテゴリから探す</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/jobs?category=${c.slug}`}
              className="group card-interactive text-center py-5 hover:border-moai-primary/30"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">{c.icon}</div>
              <div className="text-sm font-medium">{c.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 新着案件 ── */}
      <section className="bg-moai-cloud border-y border-moai-border">
        <div className="container-app py-12 md:py-16">
          <div className="section-header">
            <h2 className="section-title">新着案件</h2>
            <Link href="/jobs" className="section-link">すべて見る &rarr;</Link>
          </div>
          {jobs && jobs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {jobs.map((j: any, i: number) => {
                const isNew = Date.now() - new Date(j.created_at).getTime() < 86400_000;
                const isPopular = (j.proposal_count ?? 0) >= 5;
                return (
                  <Link key={j.id} href={`/jobs/${j.id}`} className="card-hover group flex flex-col animate-slide-up" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}>
                    <div className="flex items-center gap-2">
                      <span className="badge text-[11px]">{j.category}</span>
                      {isNew && <span className="badge-new text-[10px]">NEW</span>}
                      {isPopular && <span className="badge-popular text-[10px]">人気</span>}
                    </div>
                    <h3 className="mt-2.5 text-sm font-medium line-clamp-2 group-hover:text-moai-primary transition-colors leading-snug">{j.title}</h3>
                    <div className="mt-auto pt-4 flex items-end justify-between border-t border-moai-border/50 mt-3 pt-3">
                      <div>
                        <div className="text-base font-bold text-moai-ink">{formatCurrency(j.budget_min_jpy)}</div>
                        {j.budget_max_jpy && j.budget_max_jpy !== j.budget_min_jpy && (
                          <div className="text-[11px] text-moai-muted">〜 {formatCurrency(j.budget_max_jpy)}</div>
                        )}
                      </div>
                      <div className="text-xs text-moai-muted">
                        応募 {j.proposal_count ?? 0}件
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState message="まだ案件がありません" actionHref="/jobs/new" actionLabel="最初の案件を投稿する" icon="📋" />
          )}
        </div>
      </section>

      {/* ── メンバー ── */}
      <section className="container-app py-12 md:py-16">
        <div className="section-header">
          <h2 className="section-title">アクティブメンバー</h2>
          <Link href="/workers" className="section-link">もっと見る &rarr;</Link>
        </div>
        {workers && workers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {workers.map((w: any) => (
              <Link key={w.id} href={`/profile/${w.handle}`} className="card-hover group">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full overflow-hidden bg-gradient-to-br from-moai-primary/10 to-moai-primary/5 flex items-center justify-center text-sm font-semibold text-moai-primary shrink-0 ring-2 ring-moai-border">
                    {w.avatar_url ? <img src={w.avatar_url} alt="" className="h-full w-full object-cover" /> : (w.display_name?.[0] ?? "?")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate group-hover:text-moai-primary transition-colors">{w.display_name}</div>
                    <div className="flex items-center gap-2 text-xs text-moai-muted">
                      <span className="flex items-center gap-0.5">
                        <svg className="h-3 w-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        {Number(w.rating_avg).toFixed(1)}
                      </span>
                      <span>Lv.{w.level ?? 1}</span>
                    </div>
                  </div>
                </div>
                {w.tagline && <p className="mt-2.5 text-xs text-moai-muted line-clamp-2 leading-relaxed">{w.tagline}</p>}
                {w.skills?.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {w.skills.slice(0, 3).map((s: string) => <span key={s} className="badge text-[11px]">{s}</span>)}
                    {w.skills.length > 3 && <span className="badge text-[11px]">+{w.skills.length - 3}</span>}
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState message="メンバー募集中" icon="👥" />
        )}
      </section>

      {/* ── 使い方 ── */}
      <section className="border-y border-moai-border bg-white">
        <div className="container-app py-16 md:py-20">
          <h2 className="text-center text-display-sm mb-12">はじめかた</h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {STEPS.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-moai-primary/10 text-moai-primary text-2xl mb-4">
                  {s.icon}
                </div>
                <div className="text-[11px] font-semibold text-moai-primary uppercase tracking-wider mb-2">STEP {i + 1}</div>
                <h3 className="font-semibold text-base">{s.title}</h3>
                <p className="mt-2 text-sm text-moai-muted leading-relaxed">{s.text}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-7 -right-6 text-moai-border">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why MOAI ── */}
      <section className="container-app py-16 md:py-20">
        <h2 className="text-center text-display-sm mb-12">なぜ MOAI Crowd？</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {REASONS.map((r, i) => (
            <div key={i} className="card group hover:border-moai-primary/30 transition-all duration-200">
              <div className="text-2xl mb-3">{r.icon}</div>
              <h3 className="font-semibold text-sm">{r.title}</h3>
              <p className="mt-2 text-sm text-moai-muted leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      {!user && (
        <section className="border-t border-moai-border">
          <div className="relative overflow-hidden bg-gradient-to-br from-moai-primary-900 to-moai-primary-700">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
            <div className="container-app relative py-16 md:py-20 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white">始めてみませんか？</h2>
              <p className="mt-3 text-moai-primary-200 text-base">登録は30秒。手数料は業界の半額以下。</p>
              <Link href="/signup" className="mt-8 inline-flex btn btn-lg bg-white text-moai-primary-900 hover:bg-moai-primary-50 font-semibold shadow-lg">
                無料で始める
                <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ── Data ── */

const CATEGORIES = [
  { slug: "web", label: "Web制作", icon: "🌐" },
  { slug: "design", label: "デザイン", icon: "🎨" },
  { slug: "writing", label: "ライティング", icon: "✍️" },
  { slug: "video", label: "動画編集", icon: "🎬" },
  { slug: "ai", label: "AI・自動化", icon: "🤖" },
  { slug: "marketing", label: "マーケ", icon: "📈" },
];

const STEPS = [
  { title: "無料で登録", text: "メールアドレスだけで即スタート。プロフィールはAIが添削してくれます。", icon: "✨" },
  { title: "マッチング", text: "案件を投稿 or 応募。AIがあなたにピッタリの相手を見つけます。", icon: "🤝" },
  { title: "安心取引", text: "エスクローで安全に取引。完了後にお互いをレビュー。", icon: "🛡️" },
];

const REASONS = [
  { icon: "💰", title: "手数料10% — 業界最安", text: "大手は20%以上。MOAIは受注者の手取りを最優先に設計されています。" },
  { icon: "🤖", title: "AI搭載で効率UP", text: "案件の下書き、価格相場、提案文作成、プロフィール添削をAIがアシスト。" },
  { icon: "🏝️", title: "コミュニティ運営", text: "沖縄MOAIコミュニティ発。対面イベントやリアルなつながりも大切にしています。" },
];

/* ── Components ── */

function StatItem({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-2xl md:text-3xl font-bold tracking-tight ${accent ? "text-moai-primary" : "text-moai-ink"}`}>
        {value}
      </div>
      <div className="text-xs font-medium text-moai-muted mt-1">{label}</div>
    </div>
  );
}

function EmptyState({ message, actionHref, actionLabel, icon }: { message: string; actionHref?: string; actionLabel?: string; icon?: string }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <div className="empty-state-title">{message}</div>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="mt-4 inline-flex btn-accent btn-sm">{actionLabel}</Link>
      )}
    </div>
  );
}
