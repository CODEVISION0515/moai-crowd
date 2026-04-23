import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { formatDateJP } from "@/lib/utils";

export const metadata: Metadata = {
  title: "MOAIスクール｜AIを学び・実践し・仕事にする",
  description:
    "MOAIスクールは、AIの学びと実践を一気通貫で提供する沖縄発のオフライン＋オンラインハイブリッド型スクール。受講生の学び・作品・卒業発表をすべて公開。",
};

export const dynamic = "force-dynamic";

export default async function SchoolTopPage() {
  const sb = await createClient();

  const [{ data: cohorts }, { data: recentPosts }, { data: schoolWorks }] = await Promise.all([
    sb
      .from("cohorts")
      .select("*")
      .order("id", { ascending: false }),
    sb
      .from("posts")
      .select("id, title, kind, visibility, cohort_id, created_at, author:author_id(handle, display_name, avatar_url), cohorts:cohort_id(name)")
      .not("cohort_id", "is", null)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(9),
    sb
      .from("portfolios")
      .select("id, title, image_url, external_url, description, user:user_id(handle, display_name, avatar_url), cohort")
      .eq("is_school_work", true)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const activeApplication = cohorts?.find((c) => c.is_accepting_applications);

  return (
    <div className="container-app max-w-5xl py-10 md:py-16 space-y-12">
      {/* Hero */}
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 badge-accent px-3 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-moai-primary animate-pulse-dot" />
          <span className="text-xs font-semibold">MOAIスクール</span>
        </div>
        <h1 className="text-display-md md:text-display-lg">
          AIを学び、実践し、<br />仕事にする場所。
        </h1>
        <p className="text-lg text-moai-muted max-w-2xl mx-auto leading-relaxed">
          オフライン授業 × アプリでの実践課題 × 同期とのコミュニティ。<br className="hidden sm:block" />
          学ぶ→作る→受注する、までを一気通貫で。
        </p>
        {activeApplication && (
          <div className="pt-2">
            <Link
              href={activeApplication.application_url ?? `/school/apply/${activeApplication.id}`}
              className="btn-accent btn-lg"
            >
              🎯 {activeApplication.name} 募集中
            </Link>
          </div>
        )}
      </header>

      {/* Quick showcase nav */}
      <nav aria-label="ショーケースナビ" className="grid grid-cols-3 gap-3">
        <Link href="/school/gallery" className="card-interactive text-center py-5">
          <div className="text-3xl mb-2" aria-hidden="true">🎨</div>
          <div className="font-semibold text-sm">作品ギャラリー</div>
          <div className="text-[10px] text-moai-muted mt-0.5 hidden sm:block">受講生の作品を一覧</div>
        </Link>
        <Link href="/school/interviews" className="card-interactive text-center py-5">
          <div className="text-3xl mb-2" aria-hidden="true">🎙</div>
          <div className="font-semibold text-sm">受講生の声</div>
          <div className="text-[10px] text-moai-muted mt-0.5 hidden sm:block">Before / After</div>
        </Link>
        <Link href={`/school/showcase/${cohorts?.[0]?.id ?? 1}`} className="card-interactive text-center py-5">
          <div className="text-3xl mb-2" aria-hidden="true">🏆</div>
          <div className="font-semibold text-sm">卒業発表</div>
          <div className="text-[10px] text-moai-muted mt-0.5 hidden sm:block">期ごとの成果</div>
        </Link>
      </nav>

      {/* Cohorts list */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span aria-hidden="true">🎓</span>期一覧
        </h2>
        {cohorts && cohorts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {cohorts.map((c) => (
              <Link
                key={c.id}
                href={`/school/cohort/${c.id}`}
                className="card-hover group relative overflow-hidden"
              >
                {c.is_accepting_applications && (
                  <span className="absolute top-3 right-3 badge-success text-[10px]">
                    募集中
                  </span>
                )}
                <h3 className="font-bold text-lg">{c.name}</h3>
                {c.subtitle && (
                  <div className="text-xs text-moai-primary font-medium mt-1">{c.subtitle}</div>
                )}
                <div className="text-xs text-moai-muted mt-2">
                  {formatDateJP(c.starts_at)} {c.ends_at ? `〜 ${formatDateJP(c.ends_at)}` : "〜"}
                  {c.lecturer_name && <> · 講師: {c.lecturer_name}</>}
                </div>
                {c.description && (
                  <p className="mt-3 text-sm text-moai-muted line-clamp-3 leading-relaxed">
                    {c.description}
                  </p>
                )}
                <div className="mt-4 text-sm font-medium text-moai-primary group-hover:underline">
                  スペースを見る →
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon="🎓" title="期情報はまだありません" description="近日中に第1期情報を公開します" />
        )}
      </section>

      {/* Recent posts from cohorts (public) */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span aria-hidden="true">📝</span>受講生の学び
          <span className="text-xs font-normal text-moai-muted ml-2">(公開投稿のみ)</span>
        </h2>
        {recentPosts && recentPosts.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-3">
            {recentPosts.map((p: any) => (
              <Link key={p.id} href={`/community/${p.id}`} className="card-hover block">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-7 w-7 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-[10px] font-semibold text-moai-muted shrink-0">
                    <Avatar src={p.author?.avatar_url} name={p.author?.display_name} size={28} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{p.author?.display_name}</div>
                    <div className="text-[10px] text-moai-muted truncate">{p.cohorts?.name}</div>
                  </div>
                </div>
                <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{p.title}</h3>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon="📝" title="まだ投稿はありません" description="受講が始まると学びの記録がここに並びます" />
        )}
      </section>

      {/* School works showcase (teaser for Phase 3) */}
      {schoolWorks && schoolWorks.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span aria-hidden="true">🎨</span>受講生の作品
            </h2>
            <Link href="/school/gallery" className="text-sm text-moai-primary hover:underline">
              もっと見る →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {schoolWorks.map((w: any) => (
              <a
                key={w.id}
                href={w.external_url || "#"}
                target={w.external_url ? "_blank" : undefined}
                rel="noreferrer"
                className="card-hover block"
              >
                {w.image_url && (
                  <div className="h-40 -m-5 mb-3 bg-moai-cloud rounded-t-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={w.image_url} alt={w.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <h3 className="font-semibold text-sm line-clamp-1">{w.title}</h3>
                {w.description && (
                  <p className="mt-1 text-xs text-moai-muted line-clamp-2">{w.description}</p>
                )}
                <div className="mt-2 flex items-center gap-1.5 text-xs text-moai-muted">
                  <Avatar src={w.user?.avatar_url} name={w.user?.display_name} size={20} />
                  <span>{w.user?.display_name}</span>
                  {w.cohort && <span className="text-moai-primary font-medium">第{w.cohort}期</span>}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      {activeApplication && (
        <section className="card bg-gradient-to-br from-moai-primary to-moai-primary-900 text-white text-center">
          <h2 className="text-2xl font-bold">一歩踏み出す、第一歩を</h2>
          <p className="mt-2 text-sm opacity-90">
            AIを学びながら、仕事として受注できるスキルを身につけよう。
          </p>
          <div className="mt-6">
            <Link
              href={activeApplication.application_url ?? `/school/apply/${activeApplication.id}`}
              className="btn btn-lg bg-white text-moai-primary-900 font-semibold shadow-lg"
            >
              {activeApplication.name} に申し込む
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
