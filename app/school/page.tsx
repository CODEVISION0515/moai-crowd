import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSchoolMemberProfile } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { formatDateJP } from "@/lib/utils";

export const metadata: Metadata = {
  title: "MOAIスクール｜AIを学び・実践し・仕事にする",
  description:
    "MOAIスクールは、AIの学びと実践を一気通貫で提供する沖縄発のオフライン＋オンラインハイブリッド型スクール。受講生の学び・作品・卒業発表をすべて公開。",
};

export const dynamic = "force-dynamic";

export default async function SchoolTopPage({
  searchParams,
}: {
  searchParams: Promise<{ gate?: string; cohort?: string }>;
}) {
  const sp = await searchParams;
  const showGateBanner = sp.gate === "members";
  const gateCohort = sp.cohort ? Number(sp.cohort) : null;

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: profile } = user
    ? await sb.from("profiles").select("role, crowd_role, cohort").eq("id", user.id).maybeSingle()
    : { data: null };
  const isMember = isSchoolMemberProfile(profile);

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
      {/* Gate banner: 受講生エリアから弾かれて来た場合 */}
      {showGateBanner && (
        <div className="card border-2 border-amber-200 bg-amber-50/60">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="text-2xl shrink-0">🔒</span>
            <div className="flex-1">
              <h2 className="font-bold">受講生エリアは会員限定です</h2>
              <p className="mt-1 text-sm text-amber-900/80 leading-relaxed">
                {gateCohort ? `第${gateCohort}期のスペース` : "このエリア"}は
                MOAIスクールの在校生・卒業生・講師のみがアクセスできます。
                受講を検討中の方は、下の「コミュニティ」で在校生と気軽に話せます。
              </p>
              <div className="mt-3 flex gap-2 flex-wrap">
                <Link href="/community" className="btn-outline btn-sm">
                  🌱 コミュニティを見る
                </Link>
                {cohorts?.[0]?.id && (
                  <Link href={`/school/showcase/${cohorts[0].id}`} className="btn-outline btn-sm">
                    🏆 卒業発表を見る
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 badge-accent px-3 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-moai-primary animate-pulse-dot" />
          <span className="text-xs font-semibold">
            MOAIスクール
            {isMember && <span className="ml-1.5 text-moai-ink">· ようこそ</span>}
          </span>
        </div>
        <h1 className="text-display-md md:text-display-lg">
          先生はいない。<br />仲間がいる。
        </h1>
        <p className="text-lg text-moai-muted max-w-2xl mx-auto leading-relaxed">
          毎週の対面授業 × 期のコミュニティ × 実践案件で、<br className="hidden sm:block" />
          AIを学び、作り、仕事にするまでを一緒に歩む。
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

      {/* 模合（もあい）の語源セクション */}
      <section className="card bg-gradient-to-br from-moai-primary/5 to-transparent border-moai-primary/20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-block text-6xl font-display font-black text-moai-primary/30 mb-2 tracking-tighter">
            模合
          </div>
          <h2 className="text-xl font-bold mb-3">沖縄の「模合（もあい）」から生まれた学び場</h2>
          <p className="text-sm md:text-base text-moai-muted leading-relaxed">
            「模合」とは、仲間でお金を持ち寄って支え合う沖縄の相互扶助文化。<br className="hidden sm:block" />
            MOAIはその精神をAI時代に引き継ぎ、<strong className="text-moai-ink">知恵と時間を持ち寄り、みんなで前に進む</strong>コミュニティです。
          </p>
          <p className="mt-3 text-sm text-moai-muted leading-relaxed">
            一人で悩まず、ゆんたくしながら。<br />
            小さな挑戦を、仲間が見守る。
          </p>
        </div>
      </section>

      {/* Member fast-track (在校生・卒業生用) */}
      {isMember && profile?.cohort && (
        <div className="card bg-gradient-to-br from-moai-primary/10 to-moai-accent/5 border-moai-primary/30">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-3xl shrink-0" aria-hidden="true">
                {profile.crowd_role === "alumni" ? "🎓" : "🌱"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-moai-primary">
                  {profile.crowd_role === "alumni" ? "卒業生" : "在校生"}
                </div>
                <div className="font-bold">あなたの期のスペースへ</div>
              </div>
            </div>
            <Link href={`/school/cohort/${profile.cohort}`} className="btn-primary btn-sm">
              第{profile.cohort}期のスペースを開く →
            </Link>
          </div>
        </div>
      )}

      {/* 見学できるもの: 非メンバー向け (and members too, link still works) */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span aria-hidden="true">👀</span>誰でも見学できる
          </h2>
          <p className="text-xs text-moai-muted mt-0.5">
            受講を検討中の方も、ここから在校生の学びや作品をのぞけます
          </p>
        </div>
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
      </section>

      {/* Cohorts list */}
      <section>
        <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span aria-hidden="true">🎓</span>期一覧
          </h2>
          {!isMember && (
            <span className="text-[11px] text-moai-muted">
              🔒 詳細は受講生エリア（在校生・卒業生限定）
            </span>
          )}
        </div>
        {cohorts && cohorts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {cohorts.map((c) => {
              const isMyCohort = profile?.cohort === c.id;
              const gated = !isMember;
              return (
                <Link
                  key={c.id}
                  href={gated ? `/school/showcase/${c.id}` : `/school/cohort/${c.id}`}
                  className="card-hover group relative overflow-hidden"
                >
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {isMyCohort && (
                      <span className="badge text-[10px] bg-moai-primary text-white">あなたの期</span>
                    )}
                    {c.is_accepting_applications && (
                      <span className="badge-success text-[10px]">募集中</span>
                    )}
                    {gated && (
                      <span className="text-[10px] text-moai-muted">🔒</span>
                    )}
                  </div>
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
                    {gated ? "卒業発表を見る →" : "スペースを見る →"}
                  </div>
                </Link>
              );
            })}
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

      {/* Cross-link: Community */}
      <section className="card bg-gradient-to-br from-emerald-50 to-transparent border-emerald-200">
        <div className="flex items-start gap-4">
          <div className="text-3xl shrink-0" aria-hidden="true">🌱</div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold">まずは気軽に、ゆんたくから</h2>
            <p className="mt-1 text-sm text-moai-muted">
              受講するか迷っている方も、コミュニティなら誰でも参加できます。
              在校生・卒業生の投稿を見たり、質問したり。まずは空気を感じてみてください。
            </p>
            <Link href="/community" className="btn-outline btn-sm mt-3">
              コミュニティを見る →
            </Link>
          </div>
        </div>
      </section>

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
