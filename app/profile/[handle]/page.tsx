import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FollowButton from "@/components/FollowButton";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

const AVAILABILITY: Record<string, { label: string; color: string }> = {
  available: { label: "🟢 受注可能", color: "text-green-700 bg-green-50" },
  limited: { label: "🟡 一部受注可", color: "text-amber-700 bg-amber-50" },
  busy: { label: "🟠 多忙", color: "text-orange-700 bg-orange-50" },
  unavailable: { label: "⚫ 受注停止中", color: "text-slate-700 bg-slate-100" },
};

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const sb = await createClient();
  const { data: profile } = await sb.from("profiles").select("*").eq("handle", handle).single();
  if (!profile) notFound();

  const { data: { user } } = await sb.auth.getUser();
  const isOwnProfile = user?.id === profile.id;

  const [
    { data: reviews }, { data: badges }, { data: portfolios },
    { data: workExps }, { data: educations }, { data: certs }, { data: recentPosts },
    followRes,
  ] = await Promise.all([
    sb.from("reviews").select("*, reviewer:reviewer_id(display_name, handle)").eq("reviewee_id", profile.id).order("created_at", { ascending: false }).limit(10),
    sb.from("user_badges").select("awarded_at, badges(slug, name, description, icon, tier)").eq("user_id", profile.id).order("awarded_at", { ascending: false }),
    sb.from("portfolios").select("*").eq("user_id", profile.id).order("sort_order").order("created_at", { ascending: false }),
    sb.from("work_experiences").select("*").eq("user_id", profile.id).order("start_date", { ascending: false }),
    sb.from("educations").select("*").eq("user_id", profile.id).order("start_date", { ascending: false }),
    sb.from("certifications").select("*").eq("user_id", profile.id).order("issued_date", { ascending: false }),
    sb.from("posts").select("id, title, kind, created_at").eq("author_id", profile.id).order("created_at", { ascending: false }).limit(5),
    user && !isOwnProfile
      ? sb.from("follows").select("follower_id").eq("follower_id", user.id).eq("followee_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const isFollowing = !!followRes.data;

  // XPバーの進捗
  const currentLevelXp = Math.pow(profile.level - 1, 2) * 50;
  const nextLevelXp = Math.pow(profile.level, 2) * 50;
  const progressPct = Math.max(0, Math.min(100, ((profile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100));
  const av = AVAILABILITY[profile.availability ?? "available"];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* ヒーローカード */}
      <div className="card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-moai-primary to-teal-700" />
        <div className="relative pt-8">
          <div className="flex items-start gap-4">
            <div className="h-28 w-28 rounded-full overflow-hidden bg-white flex items-center justify-center text-4xl font-bold text-moai-primary border-4 border-white shadow-lg shrink-0">
              <Avatar src={profile.avatar_url} name={profile.display_name} size={112} priority />
            </div>
            <div className="flex-1 mt-12">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {profile.display_name}
                    {profile.verified_identity && <span title="本人確認済み" className="text-blue-500">✓</span>}
                  </h1>
                  <div className="text-sm text-slate-500">@{profile.handle}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${av.color}`}>{av.label}</span>
                  {user && !isOwnProfile && <FollowButton targetUserId={profile.id} initiallyFollowing={isFollowing} />}
                </div>
              </div>
              {profile.tagline && <p className="mt-2 text-slate-700">{profile.tagline}</p>}
              <div className="mt-3 flex items-center gap-3 text-sm flex-wrap">
                <span className="badge bg-moai-accent text-white">Lv.{profile.level}</span>
                <span>★ {Number(profile.rating_avg).toFixed(1)} ({profile.rating_count})</span>
                <span className="text-moai-muted">{profile.follower_count ?? 0} フォロワー</span>
                <span className="text-moai-muted">{profile.following_count ?? 0} フォロー中</span>
                {profile.streak_days > 0 && <span>🔥 {profile.streak_days}日連続</span>}
                {profile.years_experience && <span>💼 経験{profile.years_experience}年</span>}
                {profile.location && <span>📍 {profile.location}</span>}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{profile.xp?.toLocaleString() ?? 0} XP</span>
              <span>次のレベルまで {(nextLevelXp - profile.xp).toLocaleString()} XP</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-moai-primary to-moai-accent transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {profile.bio && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {profile.skills?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.skills.map((s: string) => <span key={s} className="badge">{s}</span>)}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {profile.hourly_rate_jpy && (
            <div><div className="text-xs text-slate-500">時給</div><div className="font-semibold">¥{profile.hourly_rate_jpy.toLocaleString()}</div></div>
          )}
          {profile.work_hours && (
            <div><div className="text-xs text-slate-500">対応時間</div><div className="font-semibold text-xs">{profile.work_hours}</div></div>
          )}
          {profile.languages?.length > 0 && (
            <div><div className="text-xs text-slate-500">言語</div><div className="font-semibold text-xs">{profile.languages.join(" / ")}</div></div>
          )}
          {profile.service_areas?.length > 0 && (
            <div><div className="text-xs text-slate-500">対応エリア</div><div className="font-semibold text-xs">{profile.service_areas.join(" / ")}</div></div>
          )}
        </div>

        {/* SNSリンク */}
        <div className="mt-4 flex flex-wrap gap-2">
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

      {/* バッジ */}
      {badges && badges.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">🏅 獲得バッジ ({badges.length})</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {badges.map((b: any) => (
              <div key={b.badges?.slug} className="card text-center" title={b.badges?.description}>
                <div className="text-4xl">{b.badges?.icon}</div>
                <div className="mt-1 text-xs font-semibold">{b.badges?.name}</div>
                <div className="text-[10px] text-slate-400 uppercase">{b.badges?.tier}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ポートフォリオ */}
      {portfolios && portfolios.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">🎨 ポートフォリオ</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {portfolios.map((p: any) => (
              <a key={p.id} href={p.external_url || "#"} target={p.external_url ? "_blank" : undefined} className="card hover:shadow-md transition">
                {p.image_url && (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden bg-moai-cloud">
                    <Image
                      src={p.image_url}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <h3 className="mt-3 font-semibold">{p.title}</h3>
                {p.description && <p className="mt-1 text-sm text-slate-600 line-clamp-3">{p.description}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.tags?.map((t: string) => <span key={t} className="badge text-xs">{t}</span>)}
                </div>
                {p.client_name && <div className="mt-2 text-xs text-slate-400">クライアント: {p.client_name}</div>}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 職歴 */}
      {workExps && workExps.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">💼 職歴</h2>
          <div className="card space-y-4">
            {workExps.map((w: any) => (
              <div key={w.id} className="border-l-2 border-moai-primary pl-4">
                <div className="font-semibold">{w.title}</div>
                <div className="text-sm text-slate-600">{w.company}</div>
                <div className="text-xs text-slate-400">{w.start_date} 〜 {w.is_current ? "現在" : w.end_date}</div>
                {w.description && <p className="mt-1 text-sm">{w.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 学歴 */}
      {educations && educations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">🎓 学歴</h2>
          <div className="card space-y-3">
            {educations.map((e: any) => (
              <div key={e.id} className="border-l-2 border-moai-accent pl-4">
                <div className="font-semibold">{e.school}</div>
                <div className="text-sm text-slate-600">{e.degree} {e.field}</div>
                <div className="text-xs text-slate-400">{e.start_date} 〜 {e.end_date}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 資格 */}
      {certs && certs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">📜 資格・認定</h2>
          <div className="card">
            <ul className="space-y-2">
              {certs.map((c: any) => (
                <li key={c.id} className="text-sm">
                  <span className="font-semibold">{c.name}</span>
                  {c.issuer && <span className="text-slate-500"> · {c.issuer}</span>}
                  {c.issued_date && <span className="text-xs text-slate-400 ml-2">{c.issued_date}</span>}
                  {c.credential_url && (
                    <a href={c.credential_url} target="_blank" className="ml-2 text-xs text-moai-primary hover:underline">証明 →</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 最近の投稿 */}
      {recentPosts && recentPosts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">📝 最近の投稿</h2>
          <div className="space-y-2">
            {recentPosts.map((p: any) => (
              <Link key={p.id} href={`/community/${p.id}`} className="card block hover:shadow-md text-sm">
                <span className="badge">{p.kind}</span>
                <span className="ml-2 font-semibold">{p.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* レビュー */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">💬 レビュー ({reviews?.length ?? 0})</h2>
        <div className="space-y-3">
          {reviews?.map((r: any) => (
            <div key={r.id} className="card">
              <div className="flex justify-between items-center">
                <Link href={`/profile/${r.reviewer?.handle}`} className="font-semibold hover:text-moai-primary">{r.reviewer?.display_name}</Link>
                <div className="text-sm text-moai-accent">{"★".repeat(r.rating)}</div>
              </div>
              {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
            </div>
          ))}
          {(!reviews || reviews.length === 0) && (
            <EmptyState icon="⭐" title="まだレビューがありません" description="案件完了後、クライアントから評価が届きます" />
          )}
        </div>
      </div>
    </div>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-moai-primary hover:text-white transition">
      {label}
    </a>
  );
}
