import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const sb = await createClient();

  const { data: profile } = await sb.from("profiles").select("*").eq("handle", handle).single();
  if (!profile) notFound();

  const [{ data: reviews }, { data: badges }, { data: recentPosts }] = await Promise.all([
    sb.from("reviews").select("*, reviewer:reviewer_id(display_name, handle)").eq("reviewee_id", profile.id).order("created_at", { ascending: false }).limit(10),
    sb.from("user_badges").select("awarded_at, badges(slug, name, description, icon, tier)").eq("user_id", profile.id).order("awarded_at", { ascending: false }),
    sb.from("posts").select("id, title, kind, created_at").eq("author_id", profile.id).order("created_at", { ascending: false }).limit(5),
  ]);

  // XPバーの進捗計算
  const currentLevelXp = Math.pow(profile.level - 1, 2) * 50;
  const nextLevelXp = Math.pow(profile.level, 2) * 50;
  const progressPct = Math.max(0, Math.min(100,
    ((profile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
  ));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-moai-primary/10 flex items-center justify-center text-2xl font-bold text-moai-primary">
            {profile.display_name?.[0] ?? "?"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            <div className="text-sm text-slate-500">@{profile.handle}</div>
            <div className="mt-1 flex items-center gap-3 text-sm flex-wrap">
              <span className="badge bg-moai-accent text-white">Lv.{profile.level}</span>
              <span>★ {Number(profile.rating_avg).toFixed(1)} ({profile.rating_count})</span>
              {profile.streak_days > 0 && <span>🔥 {profile.streak_days}日連続</span>}
            </div>
          </div>
        </div>

        {/* XPバー */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{profile.xp?.toLocaleString() ?? 0} XP</span>
            <span>次のレベルまで {(nextLevelXp - profile.xp).toLocaleString()} XP</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-moai-primary to-moai-accent transition-all"
              style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {profile.bio && <p className="mt-4 whitespace-pre-wrap text-sm">{profile.bio}</p>}
        {profile.skills?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.skills.map((s: string) => <span key={s} className="badge">{s}</span>)}
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600">
          {profile.hourly_rate_jpy && <div>時給: ¥{profile.hourly_rate_jpy.toLocaleString()}</div>}
          {profile.location && <div>拠点: {profile.location}</div>}
        </div>
      </div>

      {/* バッジ */}
      {badges && badges.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">🏅 獲得バッジ ({badges.length})</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
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

      {/* 最近の投稿 */}
      {recentPosts && recentPosts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">最近の投稿</h2>
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

      <h2 className="mt-10 text-lg font-semibold mb-3">レビュー</h2>
      <div className="space-y-3">
        {reviews?.map((r: any) => (
          <div key={r.id} className="card">
            <div className="flex justify-between items-center">
              <div className="font-semibold">{r.reviewer?.display_name}</div>
              <div className="text-sm">{"★".repeat(r.rating)}</div>
            </div>
            {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
          </div>
        ))}
        {(!reviews || reviews.length === 0) && <p className="text-sm text-slate-500">まだレビューがありません</p>}
      </div>
    </div>
  );
}
