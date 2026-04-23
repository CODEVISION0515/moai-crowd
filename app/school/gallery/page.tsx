import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { MoaiBadge } from "@/components/MoaiBadge";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = {
  title: "受講生作品ギャラリー｜MOAIスクール",
  description:
    "MOAIスクール受講生が制作した作品を一覧で閲覧できます。気に入った作品の作者に直接依頼することも可能。",
};

export const dynamic = "force-dynamic";

export default async function SchoolGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string; tag?: string }>;
}) {
  const sp = await searchParams;
  const cohortFilter = sp.cohort ? Number(sp.cohort) : null;
  const tagFilter = sp.tag ?? null;

  const sb = await createClient();

  let query = sb
    .from("portfolios")
    .select(
      "id, title, description, image_url, external_url, tags, cohort, school_project_name, completed_at, created_at, user:user_id(id, handle, display_name, avatar_url, crowd_role, moai_badge_display, tagline)"
    )
    .eq("is_school_work", true)
    .order("created_at", { ascending: false })
    .limit(60);

  if (cohortFilter) query = query.eq("cohort", cohortFilter);
  if (tagFilter) query = query.contains("tags", [tagFilter]);

  const [{ data: works }, { data: cohorts }] = await Promise.all([
    query,
    sb.from("cohorts").select("id, name").order("id"),
  ]);

  const allTags = new Set<string>();
  works?.forEach((w: any) => w.tags?.forEach((t: string) => allTags.add(t)));

  return (
    <div className="container-app max-w-5xl py-10 space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <div className="text-sm text-moai-muted">
          <Link href="/school" className="hover:text-moai-primary">🎓 MOAIスクール</Link>
          {" / "}
          <span>受講生作品ギャラリー</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">受講生の作品</h1>
        <p className="text-moai-muted max-w-2xl">
          MOAIスクールで受講生が制作した作品たちです。気に入った作品があれば、作者プロフィールから直接お仕事を依頼できます。
        </p>
      </header>

      {/* Filters */}
      {(cohorts?.length || allTags.size > 0) && (
        <div className="space-y-3">
          {/* Cohort filter */}
          {cohorts && cohorts.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-wrap">
              <Link
                href="/school/gallery"
                className={`chip whitespace-nowrap ${!cohortFilter ? "chip-active" : ""}`}
              >
                全期
              </Link>
              {cohorts.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/school/gallery?cohort=${c.id}`}
                  className={`chip whitespace-nowrap ${cohortFilter === c.id ? "chip-active" : ""}`}
                >
                  第{c.id}期
                </Link>
              ))}
            </div>
          )}

          {/* Tag filter */}
          {allTags.size > 0 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-wrap">
              {tagFilter && (
                <Link
                  href={`/school/gallery${cohortFilter ? `?cohort=${cohortFilter}` : ""}`}
                  className="chip whitespace-nowrap"
                >
                  タグクリア
                </Link>
              )}
              {[...allTags].slice(0, 15).map((t) => (
                <Link
                  key={t}
                  href={`/school/gallery?tag=${encodeURIComponent(t)}${cohortFilter ? `&cohort=${cohortFilter}` : ""}`}
                  className={`chip whitespace-nowrap ${tagFilter === t ? "chip-active" : ""}`}
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gallery grid */}
      {works && works.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {works.map((w: any) => (
            <article key={w.id} className="card hover:shadow-md transition-shadow group">
              {/* Image */}
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
                {w.cohort && (
                  <span className="absolute top-2 right-2 badge-accent text-[10px] backdrop-blur">
                    第{w.cohort}期
                  </span>
                )}
              </div>

              <h2 className="font-bold text-sm line-clamp-2">
                {w.external_url ? (
                  <a
                    href={w.external_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:text-moai-primary"
                  >
                    {w.title}
                  </a>
                ) : (
                  w.title
                )}
              </h2>
              {w.school_project_name && (
                <div className="mt-1 text-[10px] text-moai-primary font-medium">{w.school_project_name}</div>
              )}
              {w.description && (
                <p className="mt-2 text-xs text-moai-muted line-clamp-3 leading-relaxed">
                  {w.description}
                </p>
              )}

              {/* Tags */}
              {w.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {w.tags.slice(0, 3).map((t: string) => (
                    <span key={t} className="badge text-[10px]">#{t}</span>
                  ))}
                </div>
              )}

              {/* Author */}
              {w.user && (
                <Link
                  href={`/profile/${w.user.handle}`}
                  className="mt-3 pt-3 border-t border-moai-border/50 flex items-center gap-2 group/author"
                >
                  <span className="h-7 w-7 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-xs font-semibold text-moai-muted shrink-0">
                    <Avatar src={w.user.avatar_url} name={w.user.display_name} size={28} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate group-hover/author:text-moai-primary transition-colors">
                      {w.user.display_name}
                    </div>
                    <div className="text-[10px] text-moai-muted">
                      <MoaiBadge crowdRole={w.user.crowd_role} display={w.user.moai_badge_display} />
                    </div>
                  </div>
                  <span className="text-[10px] text-moai-primary font-medium shrink-0 opacity-0 group-hover/author:opacity-100 transition-opacity">
                    依頼する →
                  </span>
                </Link>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🎨"
          title="作品はまだ登録されていません"
          description={
            cohortFilter
              ? `第${cohortFilter}期の作品はまだありません`
              : "受講生が作品を公開すると、ここに並びます"
          }
        />
      )}

      {/* Info banner */}
      <div className="card bg-moai-cloud/50 text-center">
        <h3 className="font-bold text-lg mb-2">気に入った作品の作者に依頼しませんか？</h3>
        <p className="text-sm text-moai-muted mb-4">
          MOAIスクール卒業生は生涯 5% の低手数料で受注可能。<br className="hidden sm:block" />
          作者のプロフィールから直接案件を依頼できます。
        </p>
        <Link href="/jobs/new" className="btn-accent btn-sm">
          + 案件を投稿する
        </Link>
      </div>
    </div>
  );
}
