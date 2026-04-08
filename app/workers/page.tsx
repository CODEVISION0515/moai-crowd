import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; skills?: string }> }) {
  const { q, skills: skillsCsv } = await searchParams;
  const sb = await createClient();

  let query = sb.from("profiles")
    .select("id, handle, display_name, bio, skills, rating_avg, rating_count, location, hourly_rate_jpy")
    .eq("is_worker", true)
    .eq("is_suspended", false)
    .order("rating_avg", { ascending: false })
    .limit(60);

  if (q) query = query.textSearch("search_vector", q, { type: "plain", config: "simple" });
  if (skillsCsv) {
    const skillArr = skillsCsv.split(",").map((s) => s.trim()).filter(Boolean);
    if (skillArr.length) query = query.overlaps("skills", skillArr);
  }

  const { data: workers } = await query;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">受注者を探す</h1>
      <form className="card mb-6 flex gap-2">
        <input name="q" defaultValue={q} className="input" placeholder="名前・スキル・自己紹介で検索" />
        <input name="skills" defaultValue={skillsCsv} className="input max-w-xs" placeholder="スキル(カンマ区切り)" />
        <button className="btn-outline">検索</button>
      </form>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers?.map((w) => (
          <Link key={w.id} href={`/profile/${w.handle}`} className="card hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-moai-primary/10 flex items-center justify-center font-bold text-moai-primary">
                {w.display_name?.[0] ?? "?"}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">{w.display_name}</div>
                <div className="text-xs text-slate-500">★ {Number(w.rating_avg).toFixed(1)} ({w.rating_count})</div>
              </div>
            </div>
            {w.bio && <p className="mt-3 text-sm text-slate-600 line-clamp-2">{w.bio}</p>}
            {w.skills?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {w.skills.slice(0, 4).map((s: string) => <span key={s} className="badge text-xs">{s}</span>)}
              </div>
            )}
            {w.hourly_rate_jpy && (
              <div className="mt-2 text-xs text-slate-500">時給 ¥{w.hourly_rate_jpy.toLocaleString()}</div>
            )}
          </Link>
        ))}
        {(!workers || workers.length === 0) && (
          <p className="col-span-full text-center text-slate-500 py-10">見つかりませんでした</p>
        )}
      </div>
    </div>
  );
}
