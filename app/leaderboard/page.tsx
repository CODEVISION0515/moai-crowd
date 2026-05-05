import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RankBadge } from "@/components/RankBadge";
import { RANK_META, RANKS, type Rank } from "@/lib/ranks";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: { searchParams: Promise<{ scope?: string; rank?: string }> }) {
  const { scope, rank } = await searchParams;
  const sb = await createClient();

  const rankFilter: Rank | null =
    rank && (RANKS as readonly string[]).includes(rank) ? (rank as Rank) : null;

  // XP総合
  let xpQuery = sb
    .from("profiles")
    .select("id, handle, display_name, xp, level, streak_days, rating_avg, rating_count, rank, avatar_url")
    .eq("is_suspended", false)
    .order("xp", { ascending: false })
    .limit(30);
  if (rankFilter) xpQuery = xpQuery.eq("rank", rankFilter);
  const { data: topXp } = await xpQuery;

  // 評価トップ
  let ratingQuery = sb
    .from("profiles")
    .select("id, handle, display_name, rating_avg, rating_count, xp, level, rank, avatar_url")
    .eq("is_suspended", false)
    .gte("rating_count", 3)
    .order("rating_avg", { ascending: false })
    .order("rating_count", { ascending: false })
    .limit(30);
  if (rankFilter) ratingQuery = ratingQuery.eq("rank", rankFilter);
  const { data: topRating } = await ratingQuery;

  const showing = scope === "rating" ? topRating : topXp;
  const isRating = scope === "rating";

  function buildUrl(params: { scope?: string; rank?: string | null }) {
    const sp = new URLSearchParams();
    if (params.scope) sp.set("scope", params.scope);
    if (params.rank) sp.set("rank", params.rank);
    const qs = sp.toString();
    return `/leaderboard${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="container-app max-w-3xl py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">🏆 リーダーボード</h1>
      <p className="text-sm text-slate-600 mb-6">MOAIコミュニティで輝く仲間たち</p>

      {/* Scope tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Link
          href={buildUrl({ rank: rankFilter })}
          className={`badge ${!isRating ? "bg-moai-primary text-white" : ""}`}
        >
          XPランキング
        </Link>
        <Link
          href={buildUrl({ scope: "rating", rank: rankFilter })}
          className={`badge ${isRating ? "bg-moai-primary text-white" : ""}`}
        >
          評価ランキング
        </Link>
      </div>

      {/* Rank filters */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        <Link
          href={buildUrl({ scope: isRating ? "rating" : undefined })}
          className={`chip ${!rankFilter ? "chip-active" : ""}`}
        >
          全ランク
        </Link>
        {RANKS.slice(1).map((r) => (
          <Link
            key={r}
            href={buildUrl({ scope: isRating ? "rating" : undefined, rank: r })}
            className={`chip ${rankFilter === r ? "chip-active" : ""}`}
          >
            {RANK_META[r].icon} {RANK_META[r].label}
          </Link>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {showing?.map((u: any, i: number) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
          return (
            <Link
              key={u.id}
              href={`/profile/${u.handle}`}
              className={`flex items-center gap-4 p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i < 3 ? "bg-gradient-to-r from-moai-accent/5 to-transparent" : ""}`}
            >
              <div className="w-10 text-center text-2xl font-bold">{medal}</div>
              <div className="h-12 w-12 rounded-full bg-moai-primary/10 flex items-center justify-center font-bold text-moai-primary overflow-hidden">
                {u.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  u.display_name?.[0] ?? "?"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate">{u.display_name}</span>
                  <RankBadge rank={u.rank} size="xs" />
                </div>
                <div className="text-xs text-slate-500">Lv.{u.level ?? 1} · @{u.handle}</div>
              </div>
              <div className="text-right">
                {isRating ? (
                  <>
                    <div className="font-bold text-moai-accent">★ {Number(u.rating_avg).toFixed(2)}</div>
                    <div className="text-xs text-slate-500">{u.rating_count} レビュー</div>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-moai-primary">{u.xp?.toLocaleString() ?? 0} XP</div>
                    {u.streak_days > 0 && <div className="text-xs text-slate-500">🔥 {u.streak_days}日</div>}
                  </>
                )}
              </div>
            </Link>
          );
        })}
        {(!showing || showing.length === 0) && (
          <div className="p-10 text-center text-sm text-slate-500">
            このランクのユーザーはまだいません
          </div>
        )}
      </div>
    </div>
  );
}
