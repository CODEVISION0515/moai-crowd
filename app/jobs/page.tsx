import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; category?: string; skills?: string }> }) {
  const { q, category, skills: skillsCsv } = await searchParams;
  const supabase = await createClient();

  const skillFilter = skillsCsv
    ? skillsCsv.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  // RPC: 全文検索 + カテゴリ + スキルフィルタ
  const { data: jobs } = await supabase.rpc("search_jobs", {
    q: q ?? "",
    cat: category ?? null,
    skill_filter: skillFilter,
  });

  // 発注者情報を付与（RPCは型情報が薄いので別取得）
  const clientIds = Array.from(new Set((jobs ?? []).map((j: any) => j.client_id)));
  const { data: clients } = clientIds.length
    ? await supabase.from("profiles").select("id, display_name, handle").in("id", clientIds)
    : { data: [] };
  const clientMap = new Map((clients ?? []).map((c: any) => [c.id, c]));

  const { data: categories } = await supabase.from("categories").select("slug, label").order("sort_order");

  // 人気スキル集計 (open案件上位)
  const skillCounts = new Map<string, number>();
  (jobs ?? []).forEach((j: any) => (j.skills ?? []).forEach((s: string) =>
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
        <div>
          <label className="label">スキル (カンマ区切り)</label>
          <input name="skills" defaultValue={skillsCsv} className="input" placeholder="React, Figma" />
          {topSkills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {topSkills.map((s) => (
                <Link key={s} href={`/jobs?skills=${encodeURIComponent(s)}`} className="badge hover:bg-moai-primary hover:text-white">
                  {s}
                </Link>
              ))}
            </div>
          )}
        </div>
      </form>

      <div className="text-sm text-slate-500 mb-3">{jobs?.length ?? 0}件見つかりました</div>

      <div className="space-y-3">
        {jobs?.map((j: any) => {
          const client = clientMap.get(j.client_id) as any;
          return (
            <Link key={j.id} href={`/jobs/${j.id}`} className="card block hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="badge">{j.category}</span>
                  <h3 className="mt-2 font-semibold text-lg">{j.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{j.description}</p>
                  {j.skills?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {j.skills.slice(0, 5).map((s: string) => (
                        <span key={s} className="badge text-xs">{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-slate-500">
                    by {client?.display_name ?? "-"} · 応募 {j.proposal_count}件
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-bold text-moai-primary">¥{j.budget_min_jpy?.toLocaleString() ?? "-"}</div>
                  <div className="text-xs text-slate-500">〜 ¥{j.budget_max_jpy?.toLocaleString() ?? "-"}</div>
                </div>
              </div>
            </Link>
          );
        })}
        {(!jobs || jobs.length === 0) && (
          <p className="text-center text-slate-500 py-10">案件が見つかりませんでした</p>
        )}
      </div>
    </div>
  );
}
