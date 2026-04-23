import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { MoaiBadge } from "@/components/MoaiBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatDateJP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cohort: string }>;
}): Promise<Metadata> {
  const { cohort } = await params;
  const sb = await createClient();
  const { data } = await sb.from("cohorts").select("name").eq("id", cohort).maybeSingle();
  return {
    title: data ? `${data.name} 卒業発表｜MOAIスクール` : "卒業発表",
    description: data ? `MOAIスクール${data.name}の受講生が学びの集大成として制作した作品集。` : undefined,
  };
}

export default async function CohortShowcasePage({
  params,
}: {
  params: Promise<{ cohort: string }>;
}) {
  const { cohort } = await params;
  const cohortId = Number(cohort);
  if (!Number.isInteger(cohortId) || cohortId < 1) notFound();

  const sb = await createClient();

  const [{ data: cohortData }, { data: works }, { data: interviews }, { data: members }] =
    await Promise.all([
      sb.from("cohorts").select("*").eq("id", cohortId).maybeSingle(),
      sb
        .from("portfolios")
        .select(
          "id, title, description, image_url, external_url, tags, school_project_name, user:user_id(handle, display_name, avatar_url, crowd_role, moai_badge_display)"
        )
        .eq("is_school_work", true)
        .eq("cohort", cohortId)
        .order("created_at", { ascending: false }),
      sb
        .from("interviews")
        .select(
          "id, slug, title, summary, hero_image_url, subject:subject_user_id(handle, display_name, avatar_url, crowd_role, moai_badge_display)"
        )
        .eq("cohort_id", cohortId)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(6),
      sb
        .from("profiles")
        .select("id, handle, display_name, avatar_url, crowd_role, moai_badge_display, tagline")
        .eq("cohort", cohortId),
    ]);

  if (!cohortData) notFound();

  return (
    <div className="container-app max-w-5xl py-10 space-y-12">
      {/* Breadcrumb */}
      <div className="text-sm text-moai-muted">
        <Link href="/school" className="hover:text-moai-primary">🎓 MOAIスクール</Link>
        {" / "}
        <span>{cohortData.name} 卒業発表</span>
      </div>

      {/* Hero */}
      <header className="card bg-gradient-to-br from-moai-primary to-moai-primary-900 text-white">
        <div className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">
          {cohortData.subtitle ?? `第${cohortId}期`}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{cohortData.name}</h1>
        <h2 className="text-xl md:text-2xl font-medium opacity-90">卒業発表・作品集</h2>
        <div className="mt-4 text-sm opacity-90">
          📅 {formatDateJP(cohortData.starts_at)} {cohortData.ends_at ? `〜 ${formatDateJP(cohortData.ends_at)}` : ""}
          {cohortData.lecturer_name && <> · 👨‍🏫 {cohortData.lecturer_name}</>}
        </div>
        <p className="mt-4 text-sm leading-relaxed opacity-95 whitespace-pre-wrap">
          {cohortData.description}
        </p>
      </header>

      {/* Members */}
      {members && members.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span aria-hidden="true">👥</span>受講生・卒業生 ({members.length}名)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {members.map((m: any) => (
              <Link key={m.id} href={`/profile/${m.handle}`} className="card-hover flex items-center gap-3">
                <span className="h-10 w-10 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-xs font-semibold text-moai-muted shrink-0">
                  <Avatar src={m.avatar_url} name={m.display_name} size={40} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{m.display_name}</div>
                  <MoaiBadge crowdRole={m.crowd_role} display={m.moai_badge_display} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Works */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span aria-hidden="true">🎨</span>卒業制作・作品集
        </h2>
        {works && works.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {works.map((w: any) => (
              <article key={w.id} className="card hover:shadow-md transition-shadow group">
                <div className="relative h-44 -m-5 mb-3 bg-moai-cloud rounded-t-xl overflow-hidden">
                  {w.image_url ? (
                    <Image
                      src={w.image_url}
                      alt={w.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-5xl" aria-hidden="true">
                      🎨
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm line-clamp-2">
                  {w.external_url ? (
                    <a href={w.external_url} target="_blank" rel="noreferrer noopener" className="hover:text-moai-primary">
                      {w.title}
                    </a>
                  ) : (
                    w.title
                  )}
                </h3>
                {w.school_project_name && (
                  <div className="mt-1 text-[10px] text-moai-primary font-medium">{w.school_project_name}</div>
                )}
                {w.description && (
                  <p className="mt-2 text-xs text-moai-muted line-clamp-3 leading-relaxed">{w.description}</p>
                )}
                {w.user && (
                  <Link
                    href={`/profile/${w.user.handle}`}
                    className="mt-3 pt-3 border-t border-moai-border/50 flex items-center gap-2 group/author"
                  >
                    <span className="h-7 w-7 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-xs shrink-0">
                      <Avatar src={w.user.avatar_url} name={w.user.display_name} size={28} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate group-hover/author:text-moai-primary transition-colors">
                        {w.user.display_name}
                      </div>
                    </div>
                  </Link>
                )}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon="🎨" title="まだ作品はありません" description="卒業制作が完了すると、ここに並びます" />
        )}
      </section>

      {/* Interviews */}
      {interviews && interviews.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span aria-hidden="true">🎙</span>受講生インタビュー
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {interviews.map((iv: any) => (
              <Link key={iv.id} href={`/school/interviews/${iv.slug}`} className="card hover:shadow-md transition-shadow group block">
                <div className="flex gap-3">
                  {iv.hero_image_url && (
                    <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-moai-cloud shrink-0">
                      <Image
                        src={iv.hero_image_url}
                        alt={iv.title}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm line-clamp-2 group-hover:text-moai-primary transition-colors">
                      {iv.title}
                    </h3>
                    {iv.summary && (
                      <p className="mt-1 text-xs text-moai-muted line-clamp-2 leading-relaxed">{iv.summary}</p>
                    )}
                    {iv.subject && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-moai-muted">
                        <Avatar src={iv.subject.avatar_url} name={iv.subject.display_name} size={16} />
                        <span>{iv.subject.display_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="card bg-moai-cloud text-center">
        <h3 className="text-xl font-bold">あなたも次期で学びませんか？</h3>
        <p className="mt-2 text-sm text-moai-muted">
          {cohortData.name} の先輩たちのように、AIを学び・実践し・仕事にするレベルへ。
        </p>
        <div className="mt-4">
          <Link href="/school" className="btn-accent">
            MOAIスクールを見る
          </Link>
        </div>
      </section>
    </div>
  );
}
