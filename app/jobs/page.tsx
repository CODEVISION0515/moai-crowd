import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BookmarkButton from "@/components/BookmarkButton";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SortKey = "newest" | "budget_high" | "budget_low" | "proposals";

export default async function JobsPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; category?: string; skills?: string; sort?: string }> }) {
  const { q, category, skills: skillsCsv, sort } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const skillFilter = skillsCsv
    ? skillsCsv.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  // RPC: 全文検索 + カテゴリ + スキルフィルタ
  const { data: jobs } = await supabase.rpc("search_jobs", {
    q: q ?? "",
    cat: category ?? null,
    skill_filter: skillFilter,
  });

  // ソート
  const sortKey = (sort || "newest") as SortKey;
  const sorted = [...(jobs ?? [])].sort((a, b) => {
    switch (sortKey) {
      case "budget_high": return (b.budget_max_jpy ?? 0) - (a.budget_max_jpy ?? 0);
      case "budget_low": return (a.budget_min_jpy ?? 0) - (b.budget_min_jpy ?? 0);
      case "proposals": return (b.proposal_count ?? 0) - (a.proposal_count ?? 0);
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // 発注者情報を付与
  const clientIds = Array.from(new Set(sorted.map((j: Record<string, unknown>) => j.client_id as string)));
  const { data: clients } = clientIds.length
    ? await supabase.from("profiles").select("id, display_name, handle").in("id", clientIds)
    : { data: [] };
  const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));

  // ユーザーのブックマーク取得
  let bookmarkedIds = new Set<string>();
  if (user) {
    const { data: bookmarks } = await supabase
      .from("bookmarks")
      .select("job_id")
      .eq("user_id", user.id);
    bookmarkedIds = new Set((bookmarks ?? []).map((b) => b.job_id));
  }

  const { data: categories } = await supabase.from("categories").select("slug, label").order("sort_order");

  // 人気スキル集計
  const skillCounts = new Map<string, number>();
  sorted.forEach((j: Record<string, unknown>) => ((j.skills as string[]) ?? []).forEach((s: string) =>
    skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1)
  ));
  const topSkills = Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 15).map(([s]) => s);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">案件一覧</h1>
        <Link href="/jobs/new" className="btn-primary">+ 案件を投稿</Link>
      </div>

      <form className="card mb-6 space-y-3">
        <div className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="キーワード検索 (タイトル・説明・スキル)..." className="input" />
          <select name="category" defaultValue={category} className="input max-w-xs">
            <option value="">全カテゴリ</option>
            {categories?.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
          <button className="btn-outline">検索</button>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="label">スキル (カンマ区切り)</label>
            <input name="skills" defaultValue={skillsCsv} className="input" placeholder="React, Figma" />
          </div>
          <div>
            <label className="label">並び替え</label>
            <select name="sort" defaultValue={sortKey} className="input">
              <option value="newest">新着順</option>
              <option value="budget_high">予算が高い順</option>
              <option value="budget_low">予算が低い順</option>
              <option value="proposals">応募が多い順</option>
            </select>
          </div>
        </div>
        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {topSkills.map((s) => (
              <Link key={s} href={`/jobs?skills=${encodeURIComponent(s)}`} className="badge hover:bg-moai-primary hover:text-white">
                {s}
              </Link>
            ))}
          </div>
        )}
      </form>

      <div className="text-sm text-slate-500 mb-3">{sorted.length}件見つかりました</div>

      <div className="space-y-3">
        {sorted.map((j: Record<string, unknown>) => {
          const client = clientMap.get(j.client_id as string) as Record<string, unknown> | undefined;
          const jobId = j.id as string;
          return (
            <div key={jobId} className="card hover:shadow-md transition flex items-start gap-3">
              <Link href={`/jobs/${jobId}`} className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="badge">{j.category as string}</span>
                    <h3 className="mt-2 font-semibold text-lg">{j.title as string}</h3>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{j.description as string}</p>
                    {(j.skills as string[])?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(j.skills as string[]).slice(0, 5).map((s: string) => (
                          <span key={s} className="badge text-xs">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-slate-500">
                      by {(client?.display_name as string) ?? "-"} · 応募 {j.proposal_count as number}件
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-bold text-moai-primary">{formatCurrency(j.budget_min_jpy as number)}</div>
                    <div className="text-xs text-slate-500">〜 {formatCurrency(j.budget_max_jpy as number)}</div>
                  </div>
                </div>
              </Link>
              {user && (
                <BookmarkButton jobId={jobId} isBookmarked={bookmarkedIds.has(jobId)} />
              )}
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-center text-slate-500 py-10">案件が見つかりませんでした</p>
        )}
      </div>
    </div>
  );
}
