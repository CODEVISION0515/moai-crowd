import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-moai-primary via-moai-primary-700 to-teal-900" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, white 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 40%)"
        }} />
        <div className="relative container-app py-16 md:py-24 text-white">
          <div className="max-w-2xl">
            <span className="badge bg-white/20 text-white border border-white/30">🌺 沖縄発・MOAIコミュニティ</span>
            <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
              仲間と創る、<br />仕事のマッチング。
            </h1>
            <p className="mt-5 text-lg text-white/85 leading-relaxed">
              頼みたい人と、力を貸したい人を、AIとゆんたくで繋ぐ。<br />
              手数料は業界の半分以下。受注者の手取りを守ります。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link href="/jobs" className="btn btn-lg bg-white text-moai-primary hover:bg-slate-100">案件を探す</Link>
                  <Link href="/jobs/new" className="btn btn-lg bg-moai-accent text-white hover:bg-moai-accent-600">+ 案件を投稿</Link>
                </>
              ) : (
                <>
                  <Link href="/signup" className="btn btn-lg bg-moai-accent text-white hover:bg-moai-accent-600 shadow-hover">無料で始める →</Link>
                  <Link href="/jobs" className="btn btn-lg bg-white/10 backdrop-blur text-white border border-white/30 hover:bg-white/20">案件を見る</Link>
                </>
              )}
            </div>
            <div className="mt-6 flex items-center gap-6 text-sm text-white/75">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💸</span>
                <span>手数料 業界半額以下</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                <span>仲間と学べる</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <span>AI機能が無料</span>
              </div>
            </div>
          </div>
        </div>
        {/* Wave divider */}
        <svg className="absolute bottom-0 left-0 w-full text-moai-paper" viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,32L48,29.3C96,27,192,21,288,26.7C384,32,480,48,576,48C672,48,768,32,864,26.7C960,21,1056,27,1152,32C1248,37,1344,43,1392,45.3L1440,48L1440,60L1392,60C1344,60,1248,60,1152,60C1056,60,960,60,864,60C768,60,672,60,576,60C480,60,384,60,288,60C192,60,96,60,48,60L0,60Z"/>
        </svg>
      </section>

      {/* カテゴリ */}
      <section className="container-app py-12">
        <h2 className="section-title mb-6">カテゴリから探す</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/jobs?category=${c.slug}`}
              className="card-hover flex flex-col items-center text-center py-6">
              <div className="text-4xl">{c.icon}</div>
              <div className="mt-2 text-xs font-medium">{c.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* 新着案件 */}
      <section className="container-app py-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="section-title">🔥 新着案件</h2>
          <Link href="/jobs" className="text-sm text-moai-primary hover:underline font-medium">すべて見る →</Link>
        </div>
        {jobs && jobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((j: any) => (
              <Link key={j.id} href={`/jobs/${j.id}`} className="card-hover group flex flex-col">
                <span className="badge self-start">{j.category}</span>
                <h3 className="mt-3 font-semibold line-clamp-2 group-hover:text-moai-primary transition">{j.title}</h3>
                <div className="mt-auto pt-4 flex items-end justify-between">
                  <div>
                    <div className="text-xs text-slate-500">予算</div>
                    <div className="font-bold text-moai-primary">¥{j.budget_min_jpy?.toLocaleString() ?? "-"}</div>
                  </div>
                  <div className="text-xs text-slate-400">応募 {j.proposal_count}件</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState message="まだ案件がありません" actionHref="/jobs/new" actionLabel="最初の案件を投稿する" />
        )}
      </section>

      {/* おすすめの仲間 */}
      <section className="bg-white border-y border-slate-100 py-12">
        <div className="container-app">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="section-title">⭐ おすすめの仲間</h2>
            <Link href="/workers" className="text-sm text-moai-primary hover:underline font-medium">もっと見る →</Link>
          </div>
          {workers && workers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workers.map((w: any) => (
                <Link key={w.id} href={`/profile/${w.handle}`} className="card-hover">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-moai-primary/10 flex items-center justify-center font-bold text-moai-primary shrink-0">
                      {w.avatar_url ? <img src={w.avatar_url} alt="" className="h-full w-full object-cover" /> : (w.display_name?.[0] ?? "?")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{w.display_name}</div>
                      <div className="text-xs text-slate-500">★ {Number(w.rating_avg).toFixed(1)} · Lv.{w.level ?? 1}</div>
                    </div>
                  </div>
                  {w.tagline && <p className="mt-3 text-sm text-slate-600 line-clamp-2">{w.tagline}</p>}
                  {w.skills?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {w.skills.slice(0, 3).map((s: string) => <span key={s} className="badge text-xs">{s}</span>)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState message="プロフィール掲載を待っています" />
          )}
        </div>
      </section>

      {/* 使い方 */}
      <section className="container-app py-16">
        <h2 className="section-title text-center mb-2">使い方はカンタン</h2>
        <p className="text-center text-slate-600 mb-10">登録から成約までAIがサポート</p>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={i} className="card text-center relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-moai-accent text-white font-bold flex items-center justify-center shadow-soft">{i + 1}</div>
              <div className="mt-4 text-5xl">{s.icon}</div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="bg-gradient-to-br from-moai-accent to-amber-600 text-white">
          <div className="container-app py-16 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">あなたも、仲間と創ろう。</h2>
            <p className="mt-4 text-white/90">登録は無料。手数料は業界の半額以下。</p>
            <Link href="/signup" className="mt-8 inline-flex btn btn-lg bg-white text-moai-accent-600 hover:bg-slate-100 shadow-hover">
              無料で始める →
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

const CATEGORIES = [
  { slug: "web", label: "Web制作", icon: "💻" },
  { slug: "design", label: "デザイン", icon: "🎨" },
  { slug: "writing", label: "ライティング", icon: "✍️" },
  { slug: "video", label: "動画編集", icon: "🎬" },
  { slug: "ai", label: "AI・自動化", icon: "🤖" },
  { slug: "marketing", label: "マーケ", icon: "📣" },
];

const STEPS = [
  { icon: "👋", title: "1. 登録", text: "メールアドレスで無料登録。プロフィールはAIが添削します。" },
  { icon: "🤝", title: "2. マッチング", text: "案件投稿か応募。AIがピッタリの相手を見つけてくれます。" },
  { icon: "✨", title: "3. 取引・評価", text: "エスクローで安心取引。完了後にお互いをレビュー。" },
];

function EmptyState({ message, actionHref, actionLabel }: { message: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="card text-center py-12">
      <p className="text-slate-500">{message}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="mt-4 inline-flex btn-primary btn-sm">{actionLabel}</Link>
      )}
    </div>
  );
}
