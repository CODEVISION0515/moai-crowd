import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { formatCurrency } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

const CATEGORY_META: Record<string, { label: string; emoji: string; tint: string }> = {
  web: { label: "Web制作", emoji: "💻", tint: "bg-blue-50 text-blue-700" },
  design: { label: "デザイン", emoji: "🎨", tint: "bg-purple-50 text-purple-700" },
  writing: { label: "ライティング", emoji: "✍️", tint: "bg-emerald-50 text-emerald-700" },
  video: { label: "動画・写真", emoji: "🎬", tint: "bg-rose-50 text-rose-700" },
  ai: { label: "AI・自動化", emoji: "🤖", tint: "bg-cyan-50 text-cyan-700" },
  marketing: { label: "マーケ・SNS", emoji: "📣", tint: "bg-orange-50 text-orange-700" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return `${Math.floor(days / 30)}ヶ月前`;
}

/** Promise を try/catch し、reject 時はフォールバック値を返す */
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
  let user: { id: string } | null = null;
  let jobs: any[] = [];
  let workers: any[] = [];
  let categories: any[] = [];
  let jobCount: number | null = 0;

  try {
    const supabase = await createClient();
    const authRes = await safe(supabase.auth.getUser(), { data: { user: null } } as any);
    user = authRes.data.user;

    const results = await Promise.all([
      safe(
        supabase
          .from("jobs")
          .select("id, title, category, budget_min_jpy, budget_max_jpy, proposal_count, created_at, skills, profiles:client_id(display_name, avatar_url)")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(8),
        { data: [] as any[] } as any,
      ),
      safe(
        supabase
          .from("profiles")
          .select("id, handle, display_name, tagline, avatar_url, skills, rating_avg, rating_count, hourly_rate_jpy, crowd_role")
          .eq("is_worker", true)
          .eq("is_suspended", false)
          .gte("profile_completion", 30)
          .order("rating_avg", { ascending: false })
          .limit(6),
        { data: [] as any[] } as any,
      ),
      safe(
        supabase.from("categories").select("slug, label").order("sort_order"),
        { data: [] as any[] } as any,
      ),
      safe(
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open"),
        { count: 0 } as any,
      ),
    ]);
    jobs = results[0].data ?? [];
    workers = results[1].data ?? [];
    categories = results[2].data ?? [];
    jobCount = results[3].count ?? 0;
  } catch (e) {
    console.error("[HomePage] Supabase client init failed; rendering with empty data", e);
  }

  // JSON-LD 構造化データ
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
        description: "AIに強いワーカーが集まるクラウドソーシング。業界最安級の手数料。",
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
          { "@type": "Offer", description: "発注者手数料", price: "4", priceCurrency: "JPY" },
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

      {/* ── 1. HERO ── */}
      <section className="relative overflow-hidden bg-gradient-hero-light border-b border-moai-border">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-moai-primary/[0.04] rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="container-wide relative section-pad">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-moai-border mb-5 shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" aria-hidden="true" />
              <span className="text-xs font-semibold text-moai-ink">業界最安級の手数料 / AIに強いワーカー</span>
            </div>
            <h1 className="text-display-md md:text-display-lg">
              仕事を頼む人と、<br className="sm:hidden" />
              <span className="text-moai-primary">AIで応える人</span>を、つなぐ。
            </h1>
            <p className="mt-5 text-base md:text-lg text-moai-muted leading-relaxed max-w-2xl">
              MOAI Crowdは、AIを使いこなすワーカーが集まる新しいクラウドソーシング。
              発注者手数料 <strong className="text-moai-ink">4%</strong>・受注者手数料 <strong className="text-moai-ink">5〜15%</strong>。エスクロー決済で安心。
            </p>

            {/* Hero search */}
            <form action="/jobs" method="get" className="mt-7 search-hero max-w-2xl">
              <input
                name="q"
                type="search"
                placeholder="例: ホームページ制作 / 動画編集 / Pythonスクリプト"
                aria-label="案件を検索"
              />
              <button type="submit">案件を探す</button>
            </form>
            <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-moai-muted">
              <span>人気の検索:</span>
              <Link href="/jobs?q=Webサイト制作" className="hover:text-moai-primary transition-colors">Webサイト制作</Link>
              <Link href="/jobs?q=ロゴデザイン" className="hover:text-moai-primary transition-colors">ロゴデザイン</Link>
              <Link href="/jobs?q=動画編集" className="hover:text-moai-primary transition-colors">動画編集</Link>
              <Link href="/jobs?q=AI" className="hover:text-moai-primary transition-colors">AI</Link>
            </div>

            {/* Dual CTA */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {user ? (
                <>
                  <Link href="/dashboard" className="btn-accent btn-lg">マイページへ</Link>
                  <Link href="/jobs" className="btn-outline btn-lg">案件を見る</Link>
                </>
              ) : (
                <>
                  <Link href="/signup" className="btn-accent btn-lg">無料で会員登録</Link>
                  <Link href="/jobs/new" className="btn-outline btn-lg">仕事を依頼する</Link>
                </>
              )}
            </div>
            {!user && (
              <p className="mt-3 text-xs text-moai-muted">
                登録無料・クレジットカード不要 · 公開中の案件 {(jobCount ?? 0).toLocaleString()}件
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. CATEGORY SHORTCUTS ── */}
      <section className="container-wide section-pad-sm">
        <div className="section-header mb-6">
          <h2 className="section-title text-base md:text-lg">カテゴリから探す</h2>
          <Link href="/jobs" className="section-link">すべて見る →</Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {(categories ?? []).slice(0, 6).map((c: any) => {
            const meta = CATEGORY_META[c.slug] ?? { label: c.label, emoji: "📁", tint: "bg-slate-50 text-slate-700" };
            return (
              <Link
                key={c.slug}
                href={`/jobs?category=${c.slug}`}
                className="group rounded-lg border border-moai-border bg-white p-4 hover:border-moai-primary hover:shadow-hover transition-all text-center"
              >
                <div className={`mx-auto h-10 w-10 rounded-full ${meta.tint} flex items-center justify-center text-xl`} aria-hidden="true">
                  {meta.emoji}
                </div>
                <div className="mt-2 text-xs md:text-sm font-medium text-moai-ink group-hover:text-moai-primary transition-colors">
                  {meta.label}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 3. NEW JOBS ── */}
      <section className="bg-moai-cloud/40 border-y border-moai-border">
        <div className="container-wide section-pad-sm">
          <div className="section-header mb-6">
            <div>
              <h2 className="section-title text-base md:text-lg">新着案件</h2>
              <p className="mt-0.5 text-xs text-moai-muted">公開されたばかりの仕事から探す</p>
            </div>
            <Link href="/jobs" className="section-link">すべての案件 →</Link>
          </div>

          {(jobs?.length ?? 0) > 0 ? (
            <div className="grid md:grid-cols-2 gap-3">
              {(jobs ?? []).map((j: any) => (
                <Link key={j.id} href={`/jobs/${j.id}`} className="card-job">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="badge text-[11px]">{CATEGORY_META[j.category]?.label ?? j.category}</span>
                        {Date.now() - new Date(j.created_at).getTime() < 86400_000 && <span className="badge-new text-[10px]">NEW</span>}
                        {(j.proposal_count ?? 0) >= 5 && <span className="badge-popular text-[10px]">人気</span>}
                      </div>
                      <h3 className="mt-2 font-semibold text-sm md:text-base leading-snug line-clamp-2 hover:text-moai-primary transition-colors">
                        {j.title}
                      </h3>
                      {(j.skills as string[])?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(j.skills as string[]).slice(0, 4).map((s: string) => (
                            <span key={s} className="badge text-[10px]">{s}</span>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-3 text-xs text-moai-muted">
                        <span className="inline-flex items-center gap-1">
                          <Avatar src={j.profiles?.avatar_url} name={j.profiles?.display_name} size={16} />
                          {j.profiles?.display_name ?? "-"}
                        </span>
                        <span>応募 {j.proposal_count ?? 0}</span>
                        <span>{timeAgo(j.created_at)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-base md:text-lg font-bold text-moai-ink leading-none">
                        {formatCurrency(j.budget_min_jpy)}
                      </div>
                      {(j.budget_max_jpy as number) > 0 && (j.budget_max_jpy as number) !== (j.budget_min_jpy as number) && (
                        <div className="text-[10px] text-moai-muted mt-1">〜 {formatCurrency(j.budget_max_jpy)}</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">まだ案件がありません</div>
              <div className="empty-state-desc">最初の依頼を投稿してみませんか？</div>
              <Link href="/jobs/new" className="mt-4 btn-accent btn-sm">案件を投稿する</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. PICKED WORKERS ── */}
      <section className="container-wide section-pad-sm">
        <div className="section-header mb-6">
          <div>
            <h2 className="section-title text-base md:text-lg">注目のワーカー</h2>
            <p className="mt-0.5 text-xs text-moai-muted">高評価・実績豊富なワーカーから探す</p>
          </div>
          <Link href="/workers" className="section-link">すべてのワーカー →</Link>
        </div>

        {(workers?.length ?? 0) > 0 ? (
          <div className="cs-grid-3">
            {(workers ?? []).map((w: any) => (
              <Link key={w.id} href={`/profile/${w.handle}`} className="card-worker group">
                <div className="flex items-center gap-3">
                  <Avatar src={w.avatar_url} name={w.display_name} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate group-hover:text-moai-primary transition-colors">
                      {w.display_name}
                    </div>
                    <div className="mt-0.5 text-xs text-moai-muted flex items-center gap-1">
                      <span className="text-amber-500">★</span>
                      <span className="font-medium text-moai-ink">{Number(w.rating_avg ?? 0).toFixed(1)}</span>
                      <span>({w.rating_count ?? 0})</span>
                      {w.crowd_role === "alumni" && <span className="ml-1 badge-accent text-[9px] py-0">🎓 卒業生</span>}
                    </div>
                  </div>
                </div>
                {w.tagline && (
                  <p className="mt-3 text-xs text-moai-muted line-clamp-2 leading-relaxed">{w.tagline}</p>
                )}
                {(w.skills as string[])?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(w.skills as string[]).slice(0, 4).map((s: string) => (
                      <span key={s} className="badge text-[10px]">{s}</span>
                    ))}
                  </div>
                )}
                {w.hourly_rate_jpy && (
                  <div className="mt-3 pt-3 border-t border-moai-border text-xs text-moai-muted">
                    時給目安 <span className="font-bold text-moai-ink">¥{w.hourly_rate_jpy.toLocaleString()}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">ワーカー登録を募集中です</div>
          </div>
        )}
      </section>

      {/* ── 5. PRICING COMPARISON ── */}
      <section className="bg-moai-cloud/40 border-y border-moai-border">
        <div className="container-wide section-pad">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">手数料は、業界最安級。</h2>
            <p className="mt-3 text-sm md:text-base text-moai-muted leading-relaxed">
              他社では受注金額の20%以上が手数料に消えていきます。
              MOAI Crowd は受注者の取り分を最大限に残すため、業界最安級の料金設計です。
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>サービス</th>
                  <th>受注者の手数料</th>
                  <th className="text-right">発注者の手数料</th>
                </tr>
              </thead>
              <tbody>
                <tr className="row-highlight">
                  <td>
                    <span className="font-bold">MOAI Crowd</span>
                    <span className="ml-2 badge-accent text-[10px]">最安</span>
                  </td>
                  <td>5〜15%（卒業生は5%生涯）</td>
                  <td className="text-right">4%</td>
                </tr>
                <tr>
                  <td>クラウドワークス</td>
                  <td>5〜20%</td>
                  <td className="text-right">5%</td>
                </tr>
                <tr>
                  <td>ランサーズ</td>
                  <td>16.5%</td>
                  <td className="text-right">5.5%</td>
                </tr>
                <tr>
                  <td>ココナラ</td>
                  <td>10〜22%</td>
                  <td className="text-right">5.5%</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-xs text-moai-muted text-center">
              ※ 各社公開情報に基づく目安（2026年5月時点）。最新情報は各サービスをご確認ください。
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. HOW IT WORKS (3 STEPS) ── */}
      <section className="container-wide section-pad">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold">3ステップで、すぐ始められる。</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Step n={1} title="アカウント登録" desc="メールアドレスかGoogle/LINEで30秒登録。プロフィールを書けば準備完了。" />
          <Step n={2} title="案件を探す or 依頼する" desc="ワーカーは案件に応募、発注者は依頼を投稿してワーカーを選ぶだけ。" />
          <Step n={3} title="エスクロー決済で安心納品" desc="入金は事前にエスクロー保管。納品物の検収後に受注者へ送金されます。" />
        </div>

        <div className="mt-10 text-center">
          <Link href="/how-it-works" className="btn-outline btn-lg">使い方を詳しく見る →</Link>
        </div>
      </section>

      {/* ── 7. MOAI SCHOOL / COMMUNITY THIN BANNER ── */}
      <section className="container-wide pb-12 md:pb-16">
        <div className="rounded-xl border border-moai-border bg-gradient-to-br from-moai-primary/[0.06] to-transparent p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-accent text-[10px]">関連サービス</span>
              </div>
              <h3 className="text-base md:text-lg font-bold">AIをイチから学ぶなら、MOAIスクールへ。</h3>
              <p className="mt-1 text-xs md:text-sm text-moai-muted leading-relaxed max-w-xl">
                3ヶ月でAIを実務にする沖縄発のオフラインスクール。卒業生は MOAI Crowd の手数料が <strong>5%生涯</strong> に。
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/school" className="btn-outline btn-sm">スクール詳細</Link>
              <Link href="/community" className="btn-ghost btn-sm">コミュニティ</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FINAL CTA (未ログイン時のみ) ── */}
      {!user && (
        <section className="bg-gradient-hero text-white">
          <div className="container-wide section-pad text-center">
            <h2 className="text-2xl md:text-3xl font-bold">今すぐ、はじめよう。</h2>
            <p className="mt-3 text-sm md:text-base text-white/80 max-w-xl mx-auto">
              登録無料・クレジットカード不要。仕事を探すのも、依頼するのも、3分以内に始められます。
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="btn btn-lg bg-white text-moai-primary hover:bg-white/90">無料で会員登録</Link>
              <Link href="/jobs" className="btn btn-lg border border-white/40 text-white hover:bg-white/10">まず案件を見る</Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="text-center px-4">
      <div className="mx-auto h-14 w-14 rounded-full bg-moai-primary text-white flex items-center justify-center text-xl font-bold shadow-md">
        {n}
      </div>
      <h3 className="mt-4 text-base font-bold">{title}</h3>
      <p className="mt-2 text-sm text-moai-muted leading-relaxed">{desc}</p>
    </div>
  );
}
