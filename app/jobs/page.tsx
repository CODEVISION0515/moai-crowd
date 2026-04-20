import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BookmarkButton from "@/components/BookmarkButton";
import { Avatar } from "@/components/Avatar";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SortKey = "newest" | "budget_high" | "budget_low" | "proposals";

const CATEGORY_COLORS: Record<string, string> = {
  web: "border-l-blue-400",
  design: "border-l-purple-400",
  writing: "border-l-emerald-400",
  video: "border-l-rose-400",
  ai: "border-l-cyan-400",
  marketing: "border-l-orange-400",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return `${Math.floor(days / 30)}ヶ月前`;
}

export default async function JobsPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; category?: string; skills?: string; sort?: string }> }) {
  const { q, category, skills: skillsCsv, sort } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const skillFilter = skillsCsv
    ? skillsCsv.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  const { data: jobs } = await supabase.rpc("search_jobs", {
    q: q ?? "",
    cat: category ?? null,
    skill_filter: skillFilter,
  });

  const sortKey = (sort || "newest") as SortKey;
  const sorted = [...(jobs ?? [])].sort((a, b) => {
    switch (sortKey) {
      case "budget_high": return (b.budget_max_jpy ?? 0) - (a.budget_max_jpy ?? 0);
      case "budget_low": return (a.budget_min_jpy ?? 0) - (b.budget_min_jpy ?? 0);
      case "proposals": return (b.proposal_count ?? 0) - (a.proposal_count ?? 0);
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const clientIds = Array.from(new Set(sorted.map((j: Record<string, unknown>) => j.client_id as string)));
  const { data: clients } = clientIds.length
    ? await supabase.from("profiles").select("id, display_name, handle, avatar_url").in("id", clientIds)
    : { data: [] };
  const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));

  let bookmarkedIds = new Set<string>();
  if (user) {
    const { data: bookmarks } = await supabase
      .from("bookmarks")
      .select("job_id")
      .eq("user_id", user.id);
    bookmarkedIds = new Set((bookmarks ?? []).map((b) => b.job_id));
  }

  const { data: categories } = await supabase.from("categories").select("slug, label").order("sort_order");

  const skillCounts = new Map<string, number>();
  sorted.forEach((j: Record<string, unknown>) => ((j.skills as string[]) ?? []).forEach((s: string) =>
    skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1)
  ));
  const topSkills = Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 15).map(([s]) => s);

  const hasFilters = q || category || skillsCsv;

  return (
    <div className="container-wide py-8 md:py-10 pb-nav">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">案件一覧</h1>
          <p className="text-sm text-moai-muted mt-1">{sorted.length}件の案件</p>
        </div>
        <Link href="/jobs/new" className="btn-accent gap-1">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          案件を投稿
        </Link>
      </div>

      {/* Search */}
      <form className="card mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input name="q" defaultValue={q} placeholder="キーワードで検索..." className="input-lg pl-10" />
          </div>
          <button className="btn-accent btn-lg px-6">検索</button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="label">カテゴリ</label>
            <select name="category" defaultValue={category} className="input">
              <option value="">すべて</option>
              {categories?.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="label">スキル</label>
            <input name="skills" defaultValue={skillsCsv} className="input" placeholder="React, Figma" />
          </div>
          <div className="flex-1 min-w-[140px]">
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
          <div className="mt-3 flex flex-wrap gap-1.5">
            {topSkills.map((s) => {
              const isActive = skillsCsv?.includes(s);
              return (
                <Link
                  key={s}
                  href={`/jobs?skills=${encodeURIComponent(s)}${category ? `&category=${category}` : ""}`}
                  className={isActive ? "chip chip-active" : "chip"}
                >
                  {s}
                </Link>
              );
            })}
          </div>
        )}
      </form>

      {/* Active filters summary */}
      {hasFilters && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-moai-muted">フィルター:</span>
          {q && <span className="chip chip-active">「{q}」</span>}
          {category && <span className="chip chip-active">{categories?.find(c => c.slug === category)?.label ?? category}</span>}
          {skillsCsv && <span className="chip chip-active">{skillsCsv}</span>}
          <Link href="/jobs" className="text-xs text-moai-muted hover:text-moai-ink transition-colors ml-1">クリア</Link>
        </div>
      )}

      {/* Job cards */}
      <div className="space-y-3">
        {sorted.map((j: Record<string, unknown>) => {
          const client = clientMap.get(j.client_id as string) as Record<string, string | null> | undefined;
          const jobId = j.id as string;
          const cat = j.category as string;
          const createdAt = j.created_at as string;
          const proposalCount = (j.proposal_count as number) ?? 0;
          const isNew = Date.now() - new Date(createdAt).getTime() < 86400_000;
          const isPopular = proposalCount >= 5;
          const colorClass = CATEGORY_COLORS[cat] ?? "border-l-slate-300";

          return (
            <div key={jobId} className={`card hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200 border-l-[3px] ${colorClass}`}>
              <div className="flex items-start gap-3">
                <Link href={`/jobs/${jobId}`} className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Badges row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="badge text-[11px]">{cat}</span>
                        {isNew && <span className="badge-new text-[10px]">NEW</span>}
                        {isPopular && <span className="badge-popular text-[10px]">人気</span>}
                      </div>

                      {/* Title */}
                      <h3 className="mt-2 font-semibold text-base leading-snug hover:text-moai-primary transition-colors">{j.title as string}</h3>

                      {/* Description */}
                      <p className="mt-1.5 text-sm text-moai-muted line-clamp-2 leading-relaxed">{j.description as string}</p>

                      {/* Skills */}
                      {(j.skills as string[])?.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {(j.skills as string[]).slice(0, 5).map((s: string) => (
                            <span key={s} className="badge text-[11px]">{s}</span>
                          ))}
                          {(j.skills as string[]).length > 5 && (
                            <span className="badge text-[11px]">+{(j.skills as string[]).length - 5}</span>
                          )}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="mt-3 flex items-center gap-3 text-xs text-moai-muted">
                        <span className="flex items-center gap-1.5">
                          <span className="h-4 w-4 rounded-full bg-moai-cloud overflow-hidden flex items-center justify-center text-[9px] font-medium">
                            <Avatar src={client?.avatar_url} name={client?.display_name} size={16} />
                          </span>
                          {client?.display_name ?? "-"}
                        </span>
                        <span>応募 {proposalCount}件</span>
                        <span>{timeAgo(createdAt)}</span>
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="shrink-0 text-right pt-1">
                      <div className="text-lg font-bold text-moai-ink">{formatCurrency(j.budget_min_jpy as number)}</div>
                      {(j.budget_max_jpy as number) > 0 && (j.budget_max_jpy as number) !== (j.budget_min_jpy as number) ? (
                        <div className="text-[11px] text-moai-muted mt-0.5">〜 {formatCurrency(j.budget_max_jpy as number)}</div>
                      ) : null}
                    </div>
                  </div>
                </Link>
                {user && (
                  <div className="shrink-0 pt-1">
                    <BookmarkButton jobId={jobId} isBookmarked={bookmarkedIds.has(jobId)} />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="empty-state py-20">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">案件が見つかりませんでした</div>
            <div className="empty-state-desc">検索条件を変更してみてください</div>
            {hasFilters && (
              <Link href="/jobs" className="mt-4 btn-outline btn-sm">フィルターをクリア</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
