import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { MoaiBadge } from "@/components/MoaiBadge";
import MarkdownBody from "@/components/MarkdownBody";
import { formatDateJP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sb = await createClient();
  const { data: i } = await sb
    .from("interviews")
    .select("title, summary, hero_image_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!i) return { title: "インタビュー記事" };
  return {
    title: `${i.title} | MOAIスクール受講生インタビュー`,
    description: i.summary ?? undefined,
    openGraph: {
      title: i.title,
      description: i.summary ?? undefined,
      images: i.hero_image_url ? [i.hero_image_url] : undefined,
    },
  };
}

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sb = await createClient();

  const { data: iv } = await sb
    .from("interviews")
    .select(
      "*, subject:subject_user_id(id, handle, display_name, avatar_url, crowd_role, moai_badge_display, tagline, skills, rating_avg, rating_count), cohorts:cohort_id(id, name)"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!iv || !iv.is_published) notFound();

  // ビューカウント増加 (fire and forget)
  sb.rpc("increment_interview_view", { p_slug: slug });

  // 本人の作品を取得
  let subjectWorks: any[] = [];
  if (iv.subject_user_id) {
    const { data: works } = await sb
      .from("portfolios")
      .select("id, title, image_url, external_url, cohort")
      .eq("user_id", iv.subject_user_id)
      .order("created_at", { ascending: false })
      .limit(6);
    subjectWorks = works ?? [];
  }

  return (
    <article className="container-app max-w-3xl py-10 space-y-8">
      {/* Breadcrumb */}
      <div className="text-sm text-moai-muted">
        <Link href="/school" className="hover:text-moai-primary">🎓 MOAIスクール</Link>
        {" / "}
        <Link href="/school/interviews" className="hover:text-moai-primary">受講生の声</Link>
      </div>

      {/* Hero */}
      <header className="space-y-4">
        {iv.cohorts && (
          <div className="text-xs font-semibold text-moai-primary uppercase tracking-wider">
            {iv.cohorts.name}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">{iv.title}</h1>
        {iv.summary && (
          <p className="text-lg text-moai-muted leading-relaxed">{iv.summary}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-moai-muted">
          {iv.published_at && <span>{formatDateJP(iv.published_at)}</span>}
          <span>·</span>
          <span>👁 {iv.view_count ?? 0} views</span>
        </div>
      </header>

      {iv.hero_image_url && (
        <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-moai-cloud">
          <Image
            src={iv.hero_image_url}
            alt={iv.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Before / After */}
      {(iv.before_text || iv.after_text) && (
        <section className="grid md:grid-cols-2 gap-4">
          {iv.before_text && (
            <div className="card border-l-4 border-l-slate-400">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Before 受講前</div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{iv.before_text}</p>
            </div>
          )}
          {iv.after_text && (
            <div className="card border-l-4 border-l-moai-primary bg-moai-primary/5">
              <div className="text-xs font-semibold text-moai-primary uppercase mb-2">After 受講後</div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{iv.after_text}</p>
            </div>
          )}
        </section>
      )}

      {/* Body */}
      <div className="prose prose-sm max-w-none">
        <MarkdownBody body={iv.body} />
      </div>

      {/* Subject profile card */}
      {iv.subject && (
        <aside className="card bg-gradient-to-br from-moai-primary/5 to-moai-accent/5 border-moai-primary/20">
          <div className="flex items-start gap-4">
            <span className="h-16 w-16 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-lg font-semibold text-moai-muted shrink-0">
              <Avatar src={iv.subject.avatar_url} name={iv.subject.display_name} size={64} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-lg">{iv.subject.display_name}</h2>
                <MoaiBadge crowdRole={iv.subject.crowd_role} display={iv.subject.moai_badge_display} />
              </div>
              <div className="text-xs text-moai-muted mb-1">@{iv.subject.handle}</div>
              {iv.subject.tagline && (
                <p className="text-sm mt-1 leading-relaxed">{iv.subject.tagline}</p>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-moai-muted">
                <span>★ {Number(iv.subject.rating_avg ?? 0).toFixed(1)}</span>
                <span>({iv.subject.rating_count ?? 0}件)</span>
              </div>
              {iv.subject.skills?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {iv.subject.skills.slice(0, 6).map((s: string) => (
                    <span key={s} className="badge text-[10px]">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-moai-primary/20 flex gap-2 flex-wrap">
            <Link href={`/profile/${iv.subject.handle}`} className="btn-outline btn-sm">
              プロフィール
            </Link>
            <Link href={`/jobs/new?assignee=${iv.subject.handle}`} className="btn-accent btn-sm">
              💼 この人に依頼する
            </Link>
          </div>
        </aside>
      )}

      {/* Subject works */}
      {subjectWorks.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">{iv.subject?.display_name ?? "受講生"}の作品</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {subjectWorks.map((w) => (
              <a
                key={w.id}
                href={w.external_url || "#"}
                target={w.external_url ? "_blank" : undefined}
                rel="noreferrer"
                className="card-hover p-2 block"
              >
                {w.image_url ? (
                  <div className="relative aspect-square bg-moai-cloud rounded overflow-hidden">
                    <Image
                      src={w.image_url}
                      alt={w.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-moai-cloud rounded flex items-center justify-center text-3xl" aria-hidden="true">
                    🎨
                  </div>
                )}
                <div className="mt-2 text-xs font-medium line-clamp-2">{w.title}</div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Related CTA */}
      <section className="card bg-moai-primary text-white text-center">
        <h3 className="font-bold text-lg">あなたもMOAIで学びませんか？</h3>
        <p className="mt-2 text-sm opacity-90">
          受講前ゼロから、仕事として受注できるレベルまで。MOAIスクールで一歩踏み出しましょう。
        </p>
        <div className="mt-4">
          <Link href="/school" className="btn btn-sm bg-white text-moai-primary-900 font-semibold">
            MOAIスクールを見る
          </Link>
        </div>
      </section>
    </article>
  );
}
