import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FollowButton from "@/components/FollowButton";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { MoaiBadge } from "@/components/MoaiBadge";
import { RankBadge } from "@/components/RankBadge";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

const AVAILABILITY: Record<string, { label: string; color: string }> = {
  available: { label: "🟢 受注可能", color: "text-green-700 bg-green-50" },
  limited: { label: "🟡 一部受注可", color: "text-amber-700 bg-amber-50" },
  busy: { label: "🟠 多忙", color: "text-orange-700 bg-orange-50" },
  unavailable: { label: "⚫ 受注停止中", color: "text-slate-700 bg-slate-100" },
};

type TabKey = "portfolio" | "reviews" | "career" | "posts";

const TABS: { key: TabKey; label: string }[] = [
  { key: "portfolio", label: "ポートフォリオ" },
  { key: "reviews", label: "実績・レビュー" },
  { key: "career", label: "経歴・資格" },
  { key: "posts", label: "投稿" },
];

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { handle } = await params;
  const { tab } = await searchParams;
  const activeTab = (TABS.find((t) => t.key === tab)?.key ?? "portfolio") as TabKey;

  const sb = await createClient();
  const { data: profile } = await sb.from("profiles").select("*").eq("handle", handle).single();
  if (!profile) notFound();

  const { data: { user } } = await sb.auth.getUser();
  const isOwnProfile = user?.id === profile.id;

  const [
    { data: reviews }, { data: badges }, { data: portfolios },
    { data: workExps }, { data: educations }, { data: certs }, { data: recentPosts },
    followRes,
    contractStats,
  ] = await Promise.all([
    sb.from("reviews").select("*, reviewer:reviewer_id(display_name, handle)").eq("reviewee_id", profile.id).order("created_at", { ascending: false }).limit(20),
    sb.from("user_badges").select("awarded_at, badges(slug, name, description, icon, tier)").eq("user_id", profile.id).order("awarded_at", { ascending: false }),
    sb.from("portfolios").select("*").eq("user_id", profile.id).order("sort_order").order("created_at", { ascending: false }),
    sb.from("work_experiences").select("*").eq("user_id", profile.id).order("start_date", { ascending: false }),
    sb.from("educations").select("*").eq("user_id", profile.id).order("start_date", { ascending: false }),
    sb.from("certifications").select("*").eq("user_id", profile.id).order("issued_date", { ascending: false }),
    sb.from("posts").select("id, title, kind, created_at").eq("author_id", profile.id).order("created_at", { ascending: false }).limit(10),
    user && !isOwnProfile
      ? sb.from("follows").select("follower_id").eq("follower_id", user.id).eq("followee_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
    sb.from("contracts").select("status", { count: "exact" }).eq("worker_id", profile.id),
  ]);
  const isFollowing = !!followRes.data;

  const completedContracts = ((contractStats.data ?? []) as any[]).filter((c) => c.status === "completed").length;
  const totalContracts = contractStats.count ?? 0;

  const av = AVAILABILITY[profile.availability ?? "available"];
  const buildTabUrl = (t: TabKey) => `/profile/${handle}${t === "portfolio" ? "" : `?tab=${t}`}`;

  return (
    <div className="container-wide py-6 md:py-8 pb-nav">
      <div className="grid grid-cols-1 lg:grid-cols-[20rem_minmax(0,1fr)] gap-6">
        {/* ── LEFT: Profile summary (sticky) ── */}
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] self-start space-y-4">
          {/* Hero card */}
          <div className="card text-center">
            <div className="mx-auto w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg bg-moai-cloud">
              <Avatar src={profile.avatar_url} name={profile.display_name} size={96} priority />
            </div>
            <h1 className="mt-4 text-lg font-bold flex items-center justify-center gap-1.5 flex-wrap">
              {profile.display_name}
              {profile.verified_identity && <span title="本人確認済み" className="text-blue-500">✓</span>}
            </h1>
            <div className="text-xs text-moai-muted">@{profile.handle}</div>

            <div className="mt-3 flex justify-center">
              <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${av.color}`}>{av.label}</span>
            </div>

            {profile.tagline && (
              <p className="mt-3 text-sm text-moai-ink leading-relaxed">{profile.tagline}</p>
            )}

            {/* Rating */}
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm">
              <span className="text-amber-500 text-base">★</span>
              <span className="font-bold text-moai-ink">{Number(profile.rating_avg ?? 0).toFixed(1)}</span>
              <span className="text-moai-muted">({profile.rating_count ?? 0})</span>
            </div>

            {/* Action buttons */}
            <div className="mt-5 space-y-2">
              {user && !isOwnProfile && profile.is_worker && (
                <Link href={`/jobs/new?assignee=${profile.handle}`} className="btn-accent btn-lg w-full">
                  💼 この人に依頼する
                </Link>
              )}
              {user && !isOwnProfile && (
                <FollowButton targetUserId={profile.id} initiallyFollowing={isFollowing} />
              )}
              {isOwnProfile && (
                <Link href="/profile/edit" className="btn-outline btn-sm w-full">
                  プロフィールを編集
                </Link>
              )}
              {!user && profile.is_worker && (
                <Link href={`/login?redirect=/profile/${profile.handle}`} className="btn-accent btn-lg w-full">
                  ログインして依頼
                </Link>
              )}
            </div>
          </div>

          {/* Stats panel */}
          <div className="card-flat bg-white border border-moai-border p-5 space-y-3">
            <h3 className="text-xs font-semibold text-moai-muted uppercase tracking-wider">実績</h3>
            <StatRow label="完了案件" value={`${completedContracts}件`} />
            <StatRow label="進行中" value={`${totalContracts - completedContracts}件`} />
            {profile.hourly_rate_jpy && (
              <StatRow label="時給目安" value={`¥${profile.hourly_rate_jpy.toLocaleString()}`} accent />
            )}
            {profile.years_experience && (
              <StatRow label="経験年数" value={`${profile.years_experience}年`} />
            )}
            {profile.location && (
              <StatRow label="拠点" value={profile.location} />
            )}
          </div>

          {/* MOAI status */}
          {profile.crowd_role && ["student", "alumni", "lecturer"].includes(profile.crowd_role) && (
            <div className="card-flat bg-gradient-card border border-moai-primary/20 p-5">
              <h3 className="text-xs font-semibold text-moai-primary uppercase tracking-wider mb-3">🎓 MOAI</h3>
              <div className="flex items-center gap-2 mb-2">
                <MoaiBadge crowdRole={profile.crowd_role} display={profile.moai_badge_display} cohort={profile.cohort} />
              </div>
              <div className="space-y-1.5 text-xs">
                {profile.cohort && (
                  <div className="flex justify-between text-moai-muted">
                    <span>期</span>
                    <span className="text-moai-ink font-medium">第{profile.cohort}期</span>
                  </div>
                )}
                {profile.graduation_date && (
                  <div className="flex justify-between text-moai-muted">
                    <span>卒業日</span>
                    <span className="text-moai-ink font-medium">{profile.graduation_date}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <RankBadge rank={profile.rank} size="xs" />
                </div>
              </div>
            </div>
          )}

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div className="card-flat bg-white border border-moai-border p-5">
              <h3 className="text-xs font-semibold text-moai-muted uppercase tracking-wider mb-3">スキル</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s: string) => (
                  <span key={s} className="badge text-[11px]">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* SNS Links */}
          {(profile.website || profile.twitter_handle || profile.instagram_handle ||
            profile.github_handle || profile.linkedin_url || profile.behance_url ||
            profile.youtube_url || profile.tiktok_handle) && (
            <div className="card-flat bg-white border border-moai-border p-5">
              <h3 className="text-xs font-semibold text-moai-muted uppercase tracking-wider mb-3">リンク</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.website && <SocialLink href={profile.website} label="🌐 Web" />}
                {profile.twitter_handle && <SocialLink href={`https://x.com/${profile.twitter_handle.replace("@", "")}`} label={`𝕏 ${profile.twitter_handle}`} />}
                {profile.instagram_handle && <SocialLink href={`https://instagram.com/${profile.instagram_handle.replace("@", "")}`} label={`📷 ${profile.instagram_handle}`} />}
                {profile.github_handle && <SocialLink href={`https://github.com/${profile.github_handle}`} label={`</> ${profile.github_handle}`} />}
                {profile.linkedin_url && <SocialLink href={profile.linkedin_url} label="in LinkedIn" />}
                {profile.behance_url && <SocialLink href={profile.behance_url} label="🎨 Behance" />}
                {profile.youtube_url && <SocialLink href={profile.youtube_url} label="▶️ YouTube" />}
                {profile.tiktok_handle && <SocialLink href={`https://tiktok.com/@${profile.tiktok_handle.replace("@", "")}`} label={`🎵 ${profile.tiktok_handle}`} />}
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN: Tabs + Content ── */}
        <main className="min-w-0">
          {/* Bio at top */}
          {profile.bio && (
            <div className="card mb-4">
              <h2 className="text-xs font-semibold text-moai-muted uppercase tracking-wider mb-2">自己紹介</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-moai-ink">{profile.bio}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-moai-border mb-5 overflow-x-auto scrollbar-hide">
            <nav className="flex gap-1 min-w-max" aria-label="プロフィールタブ">
              {TABS.map((t) => {
                const active = activeTab === t.key;
                const count =
                  t.key === "portfolio" ? portfolios?.length :
                  t.key === "reviews" ? reviews?.length :
                  t.key === "career" ? (workExps?.length ?? 0) + (educations?.length ?? 0) + (certs?.length ?? 0) :
                  t.key === "posts" ? recentPosts?.length :
                  0;
                return (
                  <Link
                    key={t.key}
                    href={buildTabUrl(t.key)}
                    aria-current={active ? "page" : undefined}
                    className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                      active
                        ? "border-moai-primary text-moai-primary"
                        : "border-transparent text-moai-muted hover:text-moai-ink"
                    }`}
                  >
                    {t.label}
                    {(count ?? 0) > 0 && (
                      <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-moai-primary/10 text-moai-primary" : "bg-moai-cloud text-moai-muted"}`}>
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Tab Panels */}
          {activeTab === "portfolio" && (
            <div className="space-y-6">
              {portfolios && portfolios.some((p: any) => p.is_school_work) && (
                <section>
                  <div className="flex items-end justify-between mb-3">
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <span aria-hidden="true">🎓</span>MOAIスクール作品
                    </h2>
                    <Link href="/school/gallery" className="text-xs text-moai-primary hover:underline">
                      ギャラリー →
                    </Link>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {portfolios.filter((p: any) => p.is_school_work).map((p: any) => (
                      <PortfolioCard key={p.id} p={p} schoolWork />
                    ))}
                  </div>
                </section>
              )}

              {portfolios && portfolios.filter((p: any) => !p.is_school_work).length > 0 && (
                <section>
                  <h2 className="text-base font-bold mb-3">作品集</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {portfolios.filter((p: any) => !p.is_school_work).map((p: any) => (
                      <PortfolioCard key={p.id} p={p} />
                    ))}
                  </div>
                </section>
              )}

              {(!portfolios || portfolios.length === 0) && (
                <EmptyState icon="🎨" title="ポートフォリオ未登録" description="作品を追加して実力をアピールしましょう" />
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-6">
              {/* XP / Badges (実績タブ内) */}
              {badges && badges.length > 0 && (
                <section>
                  <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                    🏅 獲得バッジ <span className="text-xs text-moai-muted font-normal">({badges.length})</span>
                  </h2>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {badges.map((b: any) => (
                      <div key={b.badges?.slug} className="card text-center" title={b.badges?.description}>
                        <div className="text-3xl">{b.badges?.icon}</div>
                        <div className="mt-1 text-[11px] font-semibold line-clamp-1">{b.badges?.name}</div>
                        <div className="text-[9px] text-moai-muted uppercase">{b.badges?.tier}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-base font-bold mb-3">クライアントの声 <span className="text-xs text-moai-muted font-normal">({reviews?.length ?? 0})</span></h2>
                <div className="space-y-3">
                  {reviews?.map((r: any) => (
                    <div key={r.id} className="card">
                      <div className="flex justify-between items-start gap-3">
                        <Link href={`/profile/${r.reviewer?.handle}`} className="font-semibold text-sm hover:text-moai-primary transition-colors">
                          {r.reviewer?.display_name}
                        </Link>
                        <div className="text-amber-500 text-sm shrink-0">{"★".repeat(r.rating)}<span className="text-slate-300">{"★".repeat(5 - r.rating)}</span></div>
                      </div>
                      {r.comment && <p className="mt-2 text-sm leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                  {(!reviews || reviews.length === 0) && (
                    <EmptyState icon="⭐" title="まだレビューがありません" description="案件完了後、クライアントから評価が届きます" />
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === "career" && (
            <div className="space-y-6">
              {workExps && workExps.length > 0 && (
                <section>
                  <h2 className="text-base font-bold mb-3 flex items-center gap-2">💼 職歴</h2>
                  <div className="card space-y-4">
                    {workExps.map((w: any) => (
                      <div key={w.id} className="border-l-2 border-moai-primary pl-4">
                        <div className="font-semibold">{w.title}</div>
                        <div className="text-sm text-moai-muted">{w.company}</div>
                        <div className="text-xs text-moai-muted">{w.start_date} 〜 {w.is_current ? "現在" : w.end_date}</div>
                        {w.description && <p className="mt-1 text-sm leading-relaxed">{w.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {educations && educations.length > 0 && (
                <section>
                  <h2 className="text-base font-bold mb-3 flex items-center gap-2">🎓 学歴</h2>
                  <div className="card space-y-3">
                    {educations.map((e: any) => (
                      <div key={e.id} className="border-l-2 border-moai-accent pl-4">
                        <div className="font-semibold">{e.school}</div>
                        <div className="text-sm text-moai-muted">{e.degree} {e.field}</div>
                        <div className="text-xs text-moai-muted">{e.start_date} 〜 {e.end_date}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {certs && certs.length > 0 && (
                <section>
                  <h2 className="text-base font-bold mb-3 flex items-center gap-2">📜 資格・認定</h2>
                  <div className="card">
                    <ul className="space-y-2">
                      {certs.map((c: any) => (
                        <li key={c.id} className="text-sm">
                          <span className="font-semibold">{c.name}</span>
                          {c.issuer && <span className="text-moai-muted"> · {c.issuer}</span>}
                          {c.issued_date && <span className="text-xs text-moai-muted ml-2">{c.issued_date}</span>}
                          {c.credential_url && (
                            <a href={c.credential_url} target="_blank" rel="noreferrer" className="ml-2 text-xs text-moai-primary hover:underline">証明 →</a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {(!workExps?.length && !educations?.length && !certs?.length) && (
                <EmptyState icon="📚" title="経歴情報なし" description="職歴・学歴・資格は未登録です" />
              )}
            </div>
          )}

          {activeTab === "posts" && (
            <div className="space-y-3">
              {recentPosts && recentPosts.length > 0 ? (
                recentPosts.map((p: any) => (
                  <Link key={p.id} href={`/community/${p.id}`} className="card-hover block">
                    <div className="flex items-center gap-2">
                      <span className="badge text-[11px]">{p.kind}</span>
                      <span className="text-xs text-moai-muted">{new Date(p.created_at).toLocaleDateString("ja-JP")}</span>
                    </div>
                    <h3 className="mt-1.5 font-semibold text-sm">{p.title}</h3>
                  </Link>
                ))
              ) : (
                <EmptyState icon="📝" title="まだ投稿がありません" description="コミュニティへの投稿がここに表示されます" />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-moai-muted">{label}</span>
      <span className={accent ? "font-bold text-moai-ink text-sm" : "font-medium text-moai-ink"}>{value}</span>
    </div>
  );
}

function PortfolioCard({ p, schoolWork }: { p: any; schoolWork?: boolean }) {
  return (
    <a
      href={p.external_url || "#"}
      target={p.external_url ? "_blank" : undefined}
      rel={p.external_url ? "noreferrer" : undefined}
      className={`card hover:shadow-hover transition group block overflow-hidden ${schoolWork ? "border-l-[3px] border-l-moai-primary" : ""}`}
    >
      {p.image_url && (
        <div className="relative w-full h-40 -m-5 mb-3 overflow-hidden bg-moai-cloud">
          <Image
            src={p.image_url}
            alt={p.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {schoolWork && p.cohort && <span className="badge-accent text-[10px]">第{p.cohort}期</span>}
        {p.school_project_name && (
          <span className="text-[10px] text-moai-primary font-medium">{p.school_project_name}</span>
        )}
      </div>
      <h3 className="mt-1 font-semibold text-sm leading-snug">{p.title}</h3>
      {p.description && <p className="mt-1 text-xs text-moai-muted line-clamp-3 leading-relaxed">{p.description}</p>}
      {p.tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {p.tags.map((t: string) => (
            <span key={t} className="badge text-[10px]">{t}</span>
          ))}
        </div>
      )}
      {p.client_name && <div className="mt-2 text-[11px] text-moai-muted">クライアント: {p.client_name}</div>}
    </a>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-[11px] px-2.5 py-1 rounded-md bg-moai-cloud hover:bg-moai-primary hover:text-white transition-colors"
    >
      {label}
    </a>
  );
}
