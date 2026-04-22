import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { MoaiBadge } from "@/components/MoaiBadge";
import { VisibilityBadge } from "@/components/VisibilityBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatDateJP, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND_META: Record<string, { icon: string; label: string; color: string }> = {
  discussion: { icon: "💬", label: "ディスカッション", color: "bg-blue-50 text-blue-700" },
  question: { icon: "❓", label: "質問", color: "bg-amber-50 text-amber-700" },
  showcase: { icon: "🎨", label: "作品", color: "bg-purple-50 text-purple-700" },
  announcement: { icon: "📣", label: "お知らせ", color: "bg-red-50 text-red-700" },
};

export default async function CohortSpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cohortId = Number(id);
  if (!Number.isInteger(cohortId) || cohortId < 1) notFound();

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  const [
    { data: cohort },
    { data: pinnedPosts },
    { data: recentPosts },
    { data: members },
    { data: upcomingEvents },
    { data: l1Jobs },
    currentUserProfile,
  ] = await Promise.all([
    sb.from("cohorts").select("*").eq("id", cohortId).maybeSingle(),
    sb
      .from("posts")
      .select("id, title, body, kind, visibility, is_pinned, created_at, author:author_id(handle, display_name, avatar_url, crowd_role, moai_badge_display)")
      .eq("cohort_id", cohortId)
      .eq("is_pinned", true)
      .order("created_at", { ascending: false })
      .limit(5),
    sb
      .from("posts")
      .select("id, title, body, kind, visibility, week_number, created_at, author:author_id(handle, display_name, avatar_url, crowd_role, moai_badge_display)")
      .eq("cohort_id", cohortId)
      .eq("is_pinned", false)
      .order("created_at", { ascending: false })
      .limit(20),
    sb
      .from("profiles")
      .select("id, handle, display_name, avatar_url, crowd_role, moai_badge_display, tagline")
      .eq("cohort", cohortId)
      .limit(30),
    sb
      .from("events")
      .select("id, title, starts_at, location, online_link, event_type")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(3),
    sb
      .from("jobs")
      .select("id, title, category, budget_min_jpy, budget_max_jpy, proposal_count")
      .eq("level", "L1")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5),
    user
      ? sb.from("profiles").select("crowd_role, cohort").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!cohort) notFound();

  const profile = currentUserProfile.data as { crowd_role?: string | null; cohort?: number | null } | null;
  const isStudent = profile?.cohort === cohortId && profile.crowd_role === "student";
  const canPost = user && (
    profile?.cohort === cohortId
    || profile?.crowd_role === "lecturer"
    || profile?.crowd_role === "community_manager"
  );

  return (
    <div className="container-app max-w-4xl py-8 pb-nav space-y-8">
      {/* Breadcrumb */}
      <div className="text-sm text-moai-muted">
        <Link href="/school" className="hover:text-moai-primary">🎓 MOAIスクール</Link>
        {" / "}
        <span>{cohort.name}</span>
      </div>

      {/* Header */}
      <header className="card bg-gradient-to-br from-moai-primary/10 to-moai-accent/5 border-moai-primary/20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            {cohort.subtitle && (
              <div className="text-xs font-semibold text-moai-primary mb-1">{cohort.subtitle}</div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold">{cohort.name}</h1>
            <div className="mt-2 text-sm text-moai-muted">
              📅 {formatDateJP(cohort.starts_at)} {cohort.ends_at ? `〜 ${formatDateJP(cohort.ends_at)}` : "〜"}
              {cohort.lecturer_name && <> · 👨‍🏫 {cohort.lecturer_name}</>}
            </div>
            {cohort.description && (
              <p className="mt-3 text-sm text-moai-ink leading-relaxed whitespace-pre-wrap">
                {cohort.description}
              </p>
            )}
          </div>
          {cohort.is_accepting_applications && (
            <Link
              href={cohort.application_url ?? `/school/apply/${cohort.id}`}
              className="btn-accent shrink-0"
            >
              申し込む
            </Link>
          )}
        </div>

        {canPost && (
          <div className="mt-5 pt-4 border-t border-moai-primary/20 flex gap-2 flex-wrap">
            <Link
              href={`/community/new?cohort=${cohortId}`}
              className="btn-primary btn-sm"
            >
              + 投稿する
            </Link>
            {profile?.crowd_role === "lecturer" && (
              <Link
                href={`/community/new?cohort=${cohortId}&kind=announcement&pinned=1`}
                className="btn-outline btn-sm"
              >
                📣 告知を投稿
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Pinned posts */}
      {pinnedPosts && pinnedPosts.length > 0 && (
        <section>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <span aria-hidden="true">📌</span>ピン留め告知
          </h2>
          <div className="space-y-2">
            {pinnedPosts.map((p: any) => {
              const kind = KIND_META[p.kind] ?? KIND_META.discussion;
              return (
                <Link key={p.id} href={`/community/${p.id}`} className="card-hover block border-l-4 border-l-moai-accent">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge text-[10px] ${kind.color}`}>{kind.icon} {kind.label}</span>
                    <VisibilityBadge visibility={p.visibility} hidePublic />
                    <span className="text-[10px] text-moai-muted">{formatDateJP(p.created_at)}</span>
                  </div>
                  <h3 className="mt-1.5 font-semibold text-sm">{p.title}</h3>
                  <div className="mt-2 flex items-center gap-2 text-xs text-moai-muted">
                    <Avatar src={p.author?.avatar_url} name={p.author?.display_name} size={20} />
                    <span>{p.author?.display_name}</span>
                    <MoaiBadge crowdRole={p.author?.crowd_role} display={p.author?.moai_badge_display} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <span aria-hidden="true">📅</span>次回の予定
          </h2>
          <div className="space-y-2">
            {upcomingEvents.map((e: any) => (
              <Link key={e.id} href={`/events/${e.id}`} className="card-hover block">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 text-center">
                    <div className="text-xs text-moai-muted">
                      {new Date(e.starts_at).toLocaleDateString("ja-JP", { month: "short" })}
                    </div>
                    <div className="text-2xl font-bold text-moai-primary leading-none">
                      {new Date(e.starts_at).getDate()}
                    </div>
                    <div className="text-[10px] text-moai-muted">
                      {new Date(e.starts_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm">{e.title}</h3>
                    <div className="mt-1 text-xs text-moai-muted">
                      📍 {e.location ?? (e.online_link ? "オンライン" : "場所未定")}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent posts by week */}
      <section>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <span aria-hidden="true">📝</span>みんなの投稿
        </h2>
        {recentPosts && recentPosts.length > 0 ? (
          <div className="space-y-2">
            {recentPosts.map((p: any) => {
              const kind = KIND_META[p.kind] ?? KIND_META.discussion;
              return (
                <Link key={p.id} href={`/community/${p.id}`} className="card-hover block">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge text-[10px] ${kind.color}`}>{kind.icon} {kind.label}</span>
                    <VisibilityBadge visibility={p.visibility} hidePublic />
                    {p.week_number && (
                      <span className="badge text-[10px] bg-moai-primary/10 text-moai-primary">第{p.week_number}週</span>
                    )}
                    <span className="text-[10px] text-moai-muted ml-auto">{formatDateJP(p.created_at)}</span>
                  </div>
                  <h3 className="mt-1.5 font-semibold text-sm">{p.title}</h3>
                  {p.body && (
                    <p className="mt-1 text-xs text-moai-muted line-clamp-2 leading-relaxed">{p.body}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-moai-muted">
                    <Avatar src={p.author?.avatar_url} name={p.author?.display_name} size={20} />
                    <span>{p.author?.display_name}</span>
                    <MoaiBadge crowdRole={p.author?.crowd_role} display={p.author?.moai_badge_display} />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="💬"
            title="まだ投稿はありません"
            description={canPost ? "最初の投稿をしてみましょう" : "受講生が投稿を始めると、ここに表示されます"}
            action={canPost ? { href: `/community/new?cohort=${cohortId}`, label: "投稿する" } : undefined}
          />
        )}
      </section>

      {/* L1 Practice Jobs (only for students of this cohort) */}
      {isStudent && l1Jobs && l1Jobs.length > 0 && (
        <section>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <span aria-hidden="true">🎯</span>在校生向け練習案件 (L1)
            <span className="text-xs font-normal text-moai-muted">メンター監修つき</span>
          </h2>
          <div className="space-y-2">
            {l1Jobs.map((j: any) => (
              <Link key={j.id} href={`/jobs/${j.id}`} className="card-hover block">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="badge text-[10px]">{j.category}</span>
                    <h3 className="mt-1 font-semibold text-sm line-clamp-1">{j.title}</h3>
                    <div className="mt-1 text-xs text-moai-muted">応募 {j.proposal_count ?? 0}件</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold">{formatCurrency(j.budget_min_jpy)}</div>
                    {j.budget_max_jpy && j.budget_max_jpy !== j.budget_min_jpy && (
                      <div className="text-[10px] text-moai-muted">〜{formatCurrency(j.budget_max_jpy)}</div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Members */}
      <section>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <span aria-hidden="true">👥</span>参加メンバー ({members?.length ?? 0})
        </h2>
        {members && members.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {members.map((m: any) => (
              <Link key={m.id} href={`/profile/${m.handle}`} className="card-hover flex items-center gap-3">
                <span className="h-10 w-10 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-xs font-semibold text-moai-muted shrink-0">
                  <Avatar src={m.avatar_url} name={m.display_name} size={40} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{m.display_name}</div>
                  <div className="text-[10px] text-moai-muted truncate">
                    <MoaiBadge crowdRole={m.crowd_role} display={m.moai_badge_display} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon="👥" title="まだメンバーがいません" description="開講前または非公開の可能性があります" />
        )}
      </section>
    </div>
  );
}
