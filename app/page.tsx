import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { formatCurrency } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

/** TS への型ヒント用のスタブ（実際は HomePage 内で getUser 結果から推論） */
async function getUserSafely() {
  return null as { id: string; email?: string | null } | null;
}

/** Promise を allSettled し、reject 時はフォールバック値を返す */
async function safe<T>(p: PromiseLike<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (e) {
    console.error("[HomePage] supabase query failed", e);
    return fallback;
  }
}

export default async function HomePage() {
  // Supabase が未設定 / 接続失敗してもトップページは描画する。
  // 各クエリは個別に try/catch して、失敗したセクションは空として扱う。
  let user: Awaited<ReturnType<typeof getUserSafely>> = null;
  let jobs: any[] = [];
  let workers: any[] = [];
  let jobCount: number | null = 0;
  let userCount: number | null = 0;
  let activeCohort: any = null;
  let schoolWorks: any[] = [];
  let interviews: any[] = [];
  let schoolPosts: any[] = [];

  try {
    const supabase = await createClient();
    user = (await safe(supabase.auth.getUser(), { data: { user: null } } as any)).data.user;

    const results = await Promise.all([
      safe(
        supabase
          .from("jobs")
          .select("id, title, category, budget_min_jpy, budget_max_jpy, proposal_count, created_at, profiles:client_id(display_name)")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(6),
        { data: [] as any[] } as any,
      ),
      safe(
        supabase
          .from("profiles")
          .select("id, handle, display_name, tagline, avatar_url, skills, rating_avg, rating_count, level")
          .eq("is_worker", true)
          .eq("is_suspended", false)
          .gte("profile_completion", 30)
          .order("rating_avg", { ascending: false })
          .limit(6),
        { data: [] as any[] } as any,
      ),
      safe(supabase.from("jobs").select("*", { count: "exact", head: true }), { count: 0 } as any),
      safe(
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_suspended", false),
        { count: 0 } as any,
      ),
      safe(
        supabase
          .from("cohorts")
          .select("id, name, subtitle, starts_at, ends_at, description, is_accepting_applications, application_url")
          .eq("is_accepting_applications", true)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle(),
        { data: null } as any,
      ),
      safe(
        supabase
          .from("portfolios")
          .select("id, title, image_url, external_url, cohort, user:user_id(handle, display_name, avatar_url)")
          .eq("is_school_work", true)
          .order("created_at", { ascending: false })
          .limit(4),
        { data: [] as any[] } as any,
      ),
      safe(
        supabase
          .from("interviews")
          .select("id, slug, title, summary, hero_image_url, subject:subject_user_id(display_name, avatar_url)")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(3),
        { data: [] as any[] } as any,
      ),
      safe(
        supabase
          .from("posts")
          .select("id, title, kind, created_at, author:author_id(handle, display_name, avatar_url)")
          .not("cohort_id", "is", null)
          .eq("visibility", "public")
          .order("created_at", { ascending: false })
          .limit(4),
        { data: [] as any[] } as any,
      ),
    ]);
    jobs = results[0].data ?? [];
    workers = results[1].data ?? [];
    jobCount = results[2].count ?? 0;
    userCount = results[3].count ?? 0;
    activeCohort = results[4].data;
    schoolWorks = results[5].data ?? [];
    interviews = results[6].data ?? [];
    schoolPosts = results[7].data ?? [];
  } catch (e) {
    console.error("[HomePage] Supabase client init failed; rendering with empty data", e);
  }

  const totalJobs = jobCount ?? 0;
  const totalUsers = userCount ?? 0;
  const hasSchoolContent =
    (schoolWorks?.length ?? 0) > 0 ||
    (interviews?.length ?? 0) > 0 ||
    (schoolPosts?.length ?? 0) > 0 ||
    !!activeCohort;

  // JSON-LD 構造化データ (Google検索でリッチリザルトに)
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://moai-crowd.vercel.app";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "株式会社CODEVISION",
        url: APP_URL,
        logo: `${APP_URL}/icon-192.png`,
        sameAs: ["https://github.com/CODEVISION0515"],
      },
      {
        "@type": "WebSite",
        name: "MOAI Crowd",
        url: APP_URL,
        description: "業界最安手数料のAI特化クラウドソーシング。沖縄発・全国展開中。",
        inLanguage: "ja-JP",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${APP_URL}/jobs?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Service",
        serviceType: "クラウドソーシング",
        provider: { "@type": "Organization", name: "株式会社CODEVISION" },
        areaServed: "JP",
        offers: [
          { "@type": "Offer", description: "発注者手数料 (ローンチ6ヶ月)", price: "0", priceCurrency: "JPY" },
          { "@type": "Offer", description: "発注者手数料 (2026年11月以降)", price: "4", priceCurrency: "JPY" },
          { "@type": "Offer", description: "受注者手数料 (一般)", price: "15", priceCurrency: "JPY" },
          { "@type": "Offer", description: "受注者手数料 (MOAI卒業生・生涯)", price: "5", priceCurrency: "JPY" },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-hero-light pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-moai-primary/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

        <div className="container-app relative py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 badge-accent px-3 py-1 rounded-full mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-moai-primary animate-pulse-dot" />
              <span className="text-xs font-semibold">沖縄発のAIプラットフォーム</span>
            </div>

            <h1 className="text-display-md md:text-display-lg">
              ゆんたくしながら、<br />AIと仲良くなる。
            </h1>
            <p className="mt-6 text-lg md:text-xl text-moai-muted leading-relaxed max-w-lg">
              仲間がいる。学びがある。仕事が生まれる。<br className="hidden sm:block" />
              沖縄の「<strong className="text-moai-ink">模合（もあい）</strong>」から生まれた、<br className="hidden sm:block" />
              AIを学び・実践し・仕事にするプラットフォーム。
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
                    30秒で無料登録
                    <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link href="/jobs" className="btn-outline btn-lg">まず案件を見る</Link>
                </>
              )}
            </div>
            {!user && (
              <p className="mt-3 text-xs text-moai-muted">
                登録は無料 · クレジットカード不要 · 1,000クレジット進呈
              </p>
            )}

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

      {/* ── Segment choice ── */}
      {!user && (
        <section className="container-app py-8 md:py-12">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <Link
              href="/signup?intent=client"
              className="group card-interactive border-2 hover:border-moai-primary/50 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-moai-primary/10 text-moai-primary text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                ローンチ期間中 手数料0%
              </div>
              <div className="text-3xl mb-3" aria-hidden="true">💼</div>
              <h3 className="text-lg font-bold mb-1">お願いしたい方</h3>
              <p className="text-sm text-moai-muted leading-relaxed">
                「こんなの作れたら…」を、MOAIで学んだ仲間が形にします。<br />
                <strong className="text-moai-ink">ローンチ6ヶ月 手数料0%</strong>
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-moai-primary group-hover:gap-2 transition-all">
                発注者として登録
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Link>

            <Link
              href="/signup?intent=worker"
              className="group card-interactive border-2 hover:border-moai-primary/50 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                卒業生は手数料5%生涯
              </div>
              <div className="text-3xl mb-3" aria-hidden="true">🎯</div>
              <h3 className="text-lg font-bold mb-1">受けたい方</h3>
              <p className="text-sm text-moai-muted leading-relaxed">
                学びながら、実践しながら、手取りを増やす。<br />
                <strong className="text-moai-ink">卒業生は5%生涯（業界は20%超）</strong>
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-moai-primary group-hover:gap-2 transition-all">
                受注者として登録
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── Stats ── */}
      <section className="border-y border-moai-border bg-white">
        <div className="container-app py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <StatItem value={`${totalJobs}+`} label="累計案件数" />
            <StatItem value={`${totalUsers}+`} label="登録メンバー" />
            <StatItem value="0-4%" label="発注者手数料" accent />
            <StatItem value="5-15%" label="受注者手数料" />
          </div>
        </div>
      </section>

      {/* ── MOAIスクールの見せる学び ── */}
      {hasSchoolContent && (
        <section className="bg-gradient-to-br from-moai-primary/5 to-moai-accent/5 border-y border-moai-border">
          <div className="container-app py-12 md:py-16 space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 badge-accent px-3 py-1 rounded-full mb-3">
                <span className="text-xs font-semibold">🎓 MOAIスクール</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">見える学び、見せる成長</h2>
              <p className="mt-3 text-sm md:text-base text-moai-muted max-w-2xl mx-auto">
                受講生の学びの軌跡、作品、成長ストーリーをすべて公開。<br className="hidden sm:block" />
                「こんなことができるようになるんだ」を体感してください。
              </p>
              {activeCohort && (
                <div className="mt-5">
                  <Link
                    href={activeCohort.application_url ?? `/school/apply/${activeCohort.id}`}
                    className="btn-accent btn-lg"
                  >
                    🎯 {activeCohort.name} 募集中
                  </Link>
                </div>
              )}
            </div>

            {/* School highlights 3 cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/school/gallery" className="card-interactive">
                <div className="text-3xl mb-2" aria-hidden="true">🎨</div>
                <h3 className="font-bold text-sm">作品ギャラリー</h3>
                <p className="mt-1 text-xs text-moai-muted">受講生が制作した作品一覧。気に入った作者に直接依頼できる</p>
              </Link>
              <Link href="/school/interviews" className="card-interactive">
                <div className="text-3xl mb-2" aria-hidden="true">🎙</div>
                <h3 className="font-bold text-sm">受講生の声</h3>
                <p className="mt-1 text-xs text-moai-muted">Before/Afterのリアルな変化をインタビュー形式で</p>
              </Link>
              <Link href={`/school/cohort/${activeCohort?.id ?? 1}`} className="card-interactive">
                <div className="text-3xl mb-2" aria-hidden="true">💬</div>
                <h3 className="font-bold text-sm">受講スペース</h3>
                <p className="mt-1 text-xs text-moai-muted">講師からの告知・宿題・同期との議論がリアルタイムで</p>
              </Link>
            </div>

            {/* Recent school posts / works */}
            {((schoolPosts?.length ?? 0) > 0 || (schoolWorks?.length ?? 0) > 0) && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* 最新のスクール投稿 */}
                {schoolPosts && schoolPosts.length > 0 && (
                  <div>
                    <h3 className="section-title mb-3 flex items-center gap-2">
                      <span aria-hidden="true">📝</span>最新の学び
                    </h3>
                    <div className="space-y-2">
                      {schoolPosts.map((p: any) => (
                        <Link key={p.id} href={`/community/${p.id}`} className="card-hover block">
                          <h4 className="font-semibold text-sm line-clamp-1">{p.title}</h4>
                          <div className="mt-1 text-xs text-moai-muted flex items-center gap-2">
                            {p.author && <Avatar src={p.author.avatar_url} name={p.author.display_name} size={16} />}
                            <span>{p.author?.display_name}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 最新の作品 */}
                {schoolWorks && schoolWorks.length > 0 && (
                  <div>
                    <h3 className="section-title mb-3 flex items-center gap-2">
                      <span aria-hidden="true">🎨</span>最新の作品
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {schoolWorks.slice(0, 4).map((w: any) => (
                        <a
                          key={w.id}
                          href={w.external_url || "#"}
                          target={w.external_url ? "_blank" : undefined}
                          rel="noreferrer"
                          className="card-hover p-2 block"
                        >
                          {w.image_url ? (
                            <div className="aspect-square bg-moai-cloud rounded overflow-hidden relative">
                              <img src={w.image_url} alt={w.title} className="w-full h-full object-cover" />
                              {w.cohort && (
                                <span className="absolute top-1 right-1 badge-accent text-[9px]">第{w.cohort}期</span>
                              )}
                            </div>
                          ) : (
                            <div className="aspect-square bg-moai-cloud rounded flex items-center justify-center text-2xl" aria-hidden="true">
                              🎨
                            </div>
                          )}
                          <div className="mt-1 text-[11px] font-medium line-clamp-1">{w.title}</div>
                          {w.user && (
                            <div className="text-[10px] text-moai-muted line-clamp-1">by {w.user.display_name}</div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interview teaser */}
            {interviews && interviews.length > 0 && (
              <div>
                <h3 className="section-title mb-3 flex items-center gap-2">
                  <span aria-hidden="true">🎙</span>受講生インタビュー
                </h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {interviews.map((iv: any) => (
                    <Link key={iv.id} href={`/school/interviews/${iv.slug}`} className="card-hover block">
                      {iv.hero_image_url && (
                        <div className="h-28 -m-5 mb-2 bg-moai-cloud rounded-t-xl overflow-hidden">
                          <img src={iv.hero_image_url} alt={iv.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <h4 className="font-semibold text-sm line-clamp-2">{iv.title}</h4>
                      {iv.summary && <p className="mt-1 text-xs text-moai-muted line-clamp-2">{iv.summary}</p>}
                      {iv.subject && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-moai-muted">
                          <Avatar src={iv.subject.avatar_url} name={iv.subject.display_name} size={16} />
                          <span>{iv.subject.display_name}</span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <Link href="/school" className="text-sm font-medium text-moai-primary hover:underline">
                → MOAIスクールをもっと見る
              </Link>
            </div>
          </div>
        </section>
      )}

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
                    <Avatar src={w.avatar_url} name={w.display_name} size={44} />
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
        <h2 className="text-center text-display-sm mb-4">MOAIらしさ、3つ</h2>
        <p className="text-center text-moai-muted mb-12 max-w-xl mx-auto">
          先生はいない、仲間がいる。<br className="hidden sm:block" />
          小さな学びも、小さな仕事も、MOAIでなら動き出す。
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {REASONS.map((r, i) => (
            <div key={i} className="card group hover:border-moai-primary/30 transition-all duration-200">
              <div className="text-2xl mb-3" aria-hidden="true">{r.icon}</div>
              <h3 className="font-semibold text-sm">{r.title}</h3>
              <p className="mt-2 text-sm text-moai-muted leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-y border-moai-border bg-moai-cloud/30">
        <div className="container-app max-w-3xl py-16 md:py-20">
          <h2 className="text-center text-display-sm mb-4">よくある質問</h2>
          <p className="text-center text-sm text-moai-muted mb-4">登録前に気になるポイントをまとめました</p>
          <div className="text-center mb-10">
            <Link href="/how-it-works" className="text-sm font-medium text-moai-primary hover:underline">
              → 決済の仕組みをもっと詳しく見る
            </Link>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <details key={i} className="card group hover:shadow-md transition-shadow">
                <summary className="cursor-pointer font-semibold text-sm flex items-center justify-between gap-4">
                  <span>Q. {f.q}</span>
                  <svg className="h-4 w-4 shrink-0 text-moai-muted transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-3 pt-3 border-t border-moai-border/50 text-sm text-moai-muted leading-relaxed whitespace-pre-line">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!user && (
        <section className="border-t border-moai-border">
          <div className="relative overflow-hidden bg-gradient-to-br from-moai-primary-900 to-moai-primary-700">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
            <div className="container-app relative py-16 md:py-20 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white">始めてみませんか？</h2>
              <p className="mt-3 text-moai-primary-200 text-base">
                登録は30秒・クレジットカード不要。<br className="sm:hidden" />
                1,000クレジット進呈 · 業界最安手数料で始めよう。
              </p>
              <div className="mt-8 flex gap-3 justify-center flex-wrap">
                <Link href="/signup?intent=client" className="btn btn-lg bg-white text-moai-primary-900 hover:bg-moai-primary-50 font-semibold shadow-lg">
                  💼 発注者として登録
                </Link>
                <Link href="/signup?intent=worker" className="btn btn-lg bg-moai-primary-800 text-white hover:bg-moai-primary-900 border border-white/20 font-semibold shadow-lg">
                  🎯 受注者として登録
                </Link>
              </div>
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
  { title: "まず覗いてみる", text: "登録なしで受講生の学び・作品・議論が見られます。楽しそうと思ったら、次へ。", icon: "👀" },
  { title: "無料で仲間入り", text: "メールアドレスだけで30秒。プロフィールづくりはAIがお手伝いします。", icon: "✨" },
  { title: "ゆんたく、学ぶ、動く", text: "コミュニティで話す、スクールで学ぶ、Crowdで仕事。あなたのペースで。", icon: "🌊" },
];

const REASONS = [
  {
    icon: "🌊",
    title: "仲間がいる",
    text: "一人で悩まず、ゆんたくしながら学ぶ。先生はいない。同じ方向を向いた仲間と進む。沖縄の「模合（もあい）」の文化そのまま、学びも仕事も共有できます。",
  },
  {
    icon: "🛠",
    title: "学びがある",
    text: "在校生の学び・作品・質問をオープンに見せる「見せる学び」設計。AI特化のカリキュラムで、明日から使える技術を手に入れる。",
  },
  {
    icon: "🤝",
    title: "仕事が生まれる",
    text: "受講中から小さな実践案件に挑戦。卒業後は手数料5%生涯で継続受注。発注者はMOAI卒業生の品質を信頼して依頼できる。",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "登録は本当に無料ですか？",
    a: "はい、完全無料です。クレジットカード登録も不要。取引が成立したときに初めて手数料が発生します。",
  },
  {
    q: "手数料はいくらですか？",
    a: "【発注者】ローンチ6ヶ月（2026年5〜10月）は0%、それ以降は4%。\n【受注者】一般15% / MOAIスクール卒業生は生涯5% / 在校生は0%。業界大手は20〜22%なので、MOAIは最安級です。",
  },
  {
    q: "発注者はどうやって支払うの？",
    a: "クレジットカード決済（Stripe）です。案件を依頼する際に契約金額を前払いし、エスクロー（第三者預託）で保管されます。成果物を承認したタイミングで受注者に送金されるので、品質に満足しなかった場合は返金可能です。",
  },
  {
    q: "受注者はどうやってお金を受け取るの？",
    a: "ご自身の銀行口座に振り込まれます。はじめて受注する際に、プロフィール編集画面からStripeの本人確認・口座登録（3〜5分）を行ってください。成果物が承認されると、MOAIの手数料を差し引いた金額が自動でStripe→あなたの銀行口座に入金されます（通常1〜7日）。",
  },
  {
    q: "成果物が気に入らなかったら？",
    a: "「修正依頼」で再対応を求められます。どうしても解決しない場合は管理者が間に入り、必要に応じて返金対応も可能です。",
  },
  {
    q: "個人事業主やフリーランスでも使えますか？",
    a: "はい、個人・法人どちらでも利用可能です。源泉徴収の自動計算や請求書発行機能もあります。",
  },
  {
    q: "AI機能とは具体的にどんな機能？",
    a: "案件タイトル・本文の自動下書き、応募文の自動生成、相場価格の提案、プロフィール文の添削など。初回登録時に1,000クレジットが進呈されるので、すぐに試せます。",
  },
  {
    q: "沖縄以外でも使えますか？",
    a: "はい、全国どこからでも利用可能です。2026年11月から福岡、2027年5月から全国展開を計画しています。",
  },
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
