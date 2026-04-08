import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: { searchParams: Promise<{ scope?: string }> }) {
  const { scope } = await searchParams;
  const sb = await createClient();

  // XP総合
  const { data: topXp } = await sb
    .from("profiles")
    .select("id, handle, display_name, xp, level, streak_days, rating_avg, rating_count")
    .eq("is_suspended", false)
    .order("xp", { ascending: false })
    .limit(30);

  // 評価トップ
  const { data: topRating } = await sb
    .from("profiles")
    .select("id, handle, display_name, rating_avg, rating_count, xp, level")
    .eq("is_suspended", false)
    .gte("rating_count", 3)
    .order("rating_avg", { ascending: false })
    .order("rating_count", { ascending: false })
    .limit(30);

  const showing = scope === "rating" ? topRating : topXp;
  const isRating = scope === "rating";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">🏆 リーダーボード</h1>
      <p className="text-sm text-slate-600 mb-6">MOAIコミュニティで輝く仲間たち</p>

      <div className="flex gap-2 mb-6">
        <Link href="/leaderboard" className={`badge ${!isRating ? "bg-moai-primary text-white" : ""}`}>XPランキング</Link>
        <Link href="/leaderboard?scope=rating" className={`badge ${isRating ? "bg-moai-primary text-white" : ""}`}>評価ランキング</Link>
      </div>

      <div className="card p-0 overflow-hidden">
        {showing?.map((u: any, i: number) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
          return (
            <Link key={u.id} href={`/profile/${u.handle}`}
              className={`flex items-center gap-4 p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i < 3 ? "bg-gradient-to-r from-moai-accent/5 to-transparent" : ""}`}>
              <div className="w-10 text-center text-2xl font-bold">{medal}</div>
              <div className="h-12 w-12 rounded-full bg-moai-primary/10 flex items-center justify-center font-bold text-moai-primary">
                {u.display_name?.[0] ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{u.display_name}</div>
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
      </div>
    </div>
  );
}
