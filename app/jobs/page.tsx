import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BookmarkButton from "@/components/BookmarkButton";
import { Avatar } from "@/components/Avatar";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SortKey = "newest" | "budget_high" | "budget_low" | "proposals";

const CATEGORY_META: Record<string, { label: string; emoji: string; tint: string }> = {
  web: { label: "Web制作", emoji: "💻", tint: "border-l-blue-400" },
  design: { label: "デザイン", emoji: "🎨", tint: "border-l-purple-400" },
  writing: { label: "ライティング", emoji: "✍️", tint: "border-l-emerald-400" },
  video: { label: "動画・写真", emoji: "🎬", tint: "border-l-rose-400" },
  ai: { label: "AI・自動化", emoji: "🤖", tint: "border-l-cyan-400" },
  marketing: { label: "マーケ・SNS", emoji: "📣", tint: "border-l-orange-400" },
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "新着順" },
  { value: "budget_high", label: "予算が高い順" },
  { value: "budget_low", label: "予算が低い順" },
  { value: "proposals", label: "応募が多い順" },
];

const BUDGET_BANDS = [
  { value: "", label: "指定なし" },
  { value: "0-50000", label: "〜5万円" },
  { value: "50000-200000", label: "5〜20万円" },
  { value: "200000-500000", label: "20〜50万円" },
  { value: "500000-", label: "50万円〜" },
];

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
}: { searchParams: Promise<{ q?: string; category?: string; skills?: string; sort?: string; budget?: string }> }) {
  const { q, category, skills: skillsCsv, sort, budget } = await searchParams;
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

  // 予算フィルタ（クライアント側）
  const [budgetMin, budgetMax] = budget
    ? budget.split("-").map((v) => (v === "" ? null : Number(v)))
    : [null, null];

  let filtered = (jobs ?? []) as Array<Record<string, unknown>>;
  if (budgetMin != null) filtered = filtered.filter((j) => (j.budget_max_jpy as number) >= budgetMin);
  if (budgetMax != null) filtered = filtered.filter((j) => (j.budget_min_jpy as number) <= budgetMax);

  const sortKey = (sort || "newest") as SortKey;
  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case "budget_high": return ((b.budget_max_jpy as number) ?? 0) - ((a.budget_max_jpy as number) ?? 0);
      case "budget_low": return ((a.budget_min_jpy as number) ?? 0) - ((b.budget_min_jpy as number) ?? 0);
      case "proposals": return ((b.proposal_count as number) ?? 0) - ((a.proposal_count as number) ?? 0);
      default: return new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime();
    }
  });

  const clientIds = Array.from(new Set(sorted.map((j) => j.client_id as string)));
  const { data: clients } = clientIds.length
    ? await supabase.from("profiles").select("id, display_name, handle, avatar_url, verified_identity").in("id", clientIds)
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

  // スキル人気度集計
  const skillCounts = new Map<string, number>();
  sorted.forEach((j) => ((j.skills as string[]) ?? []).forEach((s: string) =>
    skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1)
  ));
  const topSkills = Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 12).map(([s]) => s);

  const hasFilters = !!(q || category || skillsCsv || budget);

  // フィルタ用URL生成
  const buildUrl = (override: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const merged = {
      q: q ?? "",
      category: category ?? "",
      skills: skillsCsv ?? "",
      sort: sortKey === "newest" ? "" : sortKey,
      budget: budget ?? "",
      ...override,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, String(v));
    }
    const s = params.toString();
    return `/jobs${s ? `?${s}` : ""}`;
  };

  return (
    <div className="container-wide py-6 md:py-8 pb-nav">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">仕事を探す</h1>
          <p className="text-xs md:text-sm text-moai-muted mt-1">
            {sorted.length}件の案件 {hasFilters ? "（絞り込み中）" : ""}
          </p>
        </div>
        <Link href="/jobs/new" className="btn-accent btn-sm gap-1 whitespace-nowrap">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          案件を投稿
        </Link>
      </div>

      {/* ── Top search bar ── */}
      <form action="/jobs" method="get" className="mb-5">
        {category && <input type="hidden" name="category" value={category} />}
        {skillsCsv && <input type="hidden" name="skills" value={skillsCsv} />}
        {budget && <input type="hidden" name="budget" value={budget} />}
        {sortKey !== "newest" && <input type="hidden" name="sort" value={sortKey} />}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="キーワード（例: ホームページ、Pythonスクリプト、ロゴデザイン）"
            className="w-full rounded-lg border border-moai-border bg-white pl-11 pr-24 py-3 text-sm placeholder:text-slate-400 focus:border-moai-primary focus:outline-none focus:ring-2 focus:ring-moai-primary/10 transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-accent btn-sm px-4"
          >
            検索
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6">
        {/* ── LEFT SIDEBAR FILTERS ── */}
        <aside className="sidebar-filter">
          {/* Active filters */}
          {hasFilters && (
            <div className="sidebar-filter-group bg-moai-primary/5 border-moai-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-moai-primary">適用中のフィルタ</span>
                <Link href="/jobs" className="text-[10px] text-moai-muted hover:text-moai-ink transition-colors underline">
                  クリア
                </Link>
              </div>
              <div className="flex flex-wrap gap-1">
                {q && <span className="badge-accent text-[10px]">「{q}」</span>}
                {category && (
                  <span className="badge-accent text-[10px]">
                    {CATEGORY_META[category]?.label ?? category}
                  </span>
                )}
                {skillsCsv && <span className="badge-accent text-[10px]">{skillsCsv}</span>}
                {budget && (
                  <span className="badge-accent text-[10px]">
                    {BUDGET_BANDS.find((b) => b.value === budget)?.label ?? budget}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Category */}
          <div className="sidebar-filter-group">
            <h3 className="sidebar-filter-title">カテゴリ</h3>
            <div className="space-y-1">
              <Link
                href={buildUrl({ category: null })}
                className={`block px-2 py-1.5 rounded text-sm transition-colors ${
                  !category ? "bg-moai-primary/10 text-moai-primary font-semibold" : "text-moai-muted hover:bg-moai-cloud hover:text-moai-ink"
                }`}
              >
                すべて
              </Link>
              {(categories ?? []).map((c) => {
                const meta = CATEGORY_META[c.slug];
                const active = category === c.slug;
                return (
                  <Link
                    key={c.slug}
                    href={buildUrl({ category: c.slug })}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                      active ? "bg-moai-primary/10 text-moai-primary font-semibold" : "text-moai-muted hover:bg-moai-cloud hover:text-moai-ink"
                    }`}
                  >
                    {meta?.emoji && <span aria-hidden="true">{meta.emoji}</span>}
                    <span>{meta?.label ?? c.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Budget */}
          <div className="sidebar-filter-group">
            <h3 className="sidebar-filter-title">予算</h3>
            <div className="space-y-1">
              {BUDGET_BANDS.map((b) => {
                const active = (budget ?? "") === b.value;
                return (
                  <Link
                    key={b.value}
                    href={buildUrl({ budget: b.value || null })}
                    className={`block px-2 py-1.5 rounded text-sm transition-colors ${
                      active ? "bg-moai-primary/10 text-moai-primary font-semibold" : "text-moai-muted hover:bg-moai-cloud hover:text-moai-ink"
                    }`}
                  >
                    {b.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Skills */}
          {topSkills.length > 0 && (
            <div className="sidebar-filter-group">
              <h3 className="sidebar-filter-title">人気のスキル</h3>
              <div className="flex flex-wrap gap-1.5">
                {topSkills.map((s) => {
                  const isActive = skillsCsv?.split(",").includes(s);
                  return (
                    <Link
                      key={s}
                      href={buildUrl({ skills: isActive ? null : s })}
                      className={isActive ? "chip chip-active" : "chip"}
                    >
                      {s}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <Link href="/jobs/new" className="hidden lg:flex sidebar-filter-group bg-gradient-card border-moai-primary/30 hover:border-moai-primary transition-colors flex-col gap-2 text-center">
            <div className="text-2xl" aria-hidden="true">📝</div>
            <div className="text-sm font-bold text-moai-ink">仕事を依頼する</div>
            <div className="text-[11px] text-moai-muted leading-relaxed">
              発注者手数料 4% / 投稿無料
            </div>
          </Link>
        </aside>

        {/* ── MAIN: Sort + Job list ── */}
        <main className="min-w-0">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-4 px-1 gap-3">
            <span className="text-xs text-moai-muted shrink-0">{sorted.length}件の案件</span>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <span className="text-xs text-moai-muted">並び替え:</span>
              {SORT_OPTIONS.map((o) => {
                const active = sortKey === o.value;
                return (
                  <Link
                    key={o.value}
                    href={buildUrl({ sort: o.value === "newest" ? null : o.value })}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                      active
                        ? "bg-moai-primary/10 text-moai-primary font-semibold"
                        : "text-moai-muted hover:text-moai-ink hover:bg-moai-cloud"
                    }`}
                  >
                    {o.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Job cards */}
          {sorted.length > 0 ? (
            <div className="space-y-3">
              {sorted.map((j) => {
                const client = clientMap.get(j.client_id as string) as Record<string, string | null> | undefined;
                const jobId = j.id as string;
                const cat = j.category as string;
                const createdAt = j.created_at as string;
                const proposalCount = (j.proposal_count as number) ?? 0;
                const isNew = Date.now() - new Date(createdAt).getTime() < 86400_000;
                const isPopular = proposalCount >= 5;
                const colorClass = CATEGORY_META[cat]?.tint ?? "border-l-slate-300";

                return (
                  <article key={jobId} className={`card-job ${colorClass}`}>
                    <div className="flex items-start gap-3">
                      <Link href={`/jobs/${jobId}`} className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="badge text-[11px]">{CATEGORY_META[cat]?.label ?? cat}</span>
                              {isNew && <span className="badge-new text-[10px]">NEW</span>}
                              {isPopular && <span className="badge-popular text-[10px]">人気</span>}
                            </div>

                            <h3 className="mt-2 font-semibold text-base leading-snug hover:text-moai-primary transition-colors">
                              {j.title as string}
                            </h3>

                            <p className="mt-1.5 text-sm text-moai-muted line-clamp-2 leading-relaxed">
                              {j.description as string}
                            </p>

                            {(j.skills as string[])?.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1">
                                {(j.skills as string[]).slice(0, 6).map((s: string) => (
                                  <span key={s} className="badge text-[11px]">{s}</span>
                                ))}
                                {(j.skills as string[]).length > 6 && (
                                  <span className="badge text-[11px]">+{(j.skills as string[]).length - 6}</span>
                                )}
                              </div>
                            )}

                            <div className="mt-3 flex items-center gap-3 text-xs text-moai-muted flex-wrap">
                              <span className="inline-flex items-center gap-1.5">
                                <Avatar src={client?.avatar_url} name={client?.display_name} size={16} />
                                <span className="truncate max-w-[140px]">{client?.display_name ?? "-"}</span>
                                {client?.verified_identity && (
                                  <span title="本人確認済み" className="text-blue-500 text-[10px]">✓</span>
                                )}
                              </span>
                              <span>応募 {proposalCount}件</span>
                              <span>{timeAgo(createdAt)}</span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right pt-1">
                            <div className="text-base md:text-lg font-bold text-moai-ink leading-none">
                              {formatCurrency(j.budget_min_jpy as number)}
                            </div>
                            {(j.budget_max_jpy as number) > 0 && (j.budget_max_jpy as number) !== (j.budget_min_jpy as number) && (
                              <div className="text-[11px] text-moai-muted mt-1">〜 {formatCurrency(j.budget_max_jpy as number)}</div>
                            )}
                          </div>
                        </div>
                      </Link>
                      {user && (
                        <div className="shrink-0 pt-1">
                          <BookmarkButton jobId={jobId} isBookmarked={bookmarkedIds.has(jobId)} />
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state py-20">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">案件が見つかりませんでした</div>
              <div className="empty-state-desc">検索条件を変更してみてください</div>
              {hasFilters && (
                <Link href="/jobs" className="mt-4 btn-outline btn-sm">フィルターをクリア</Link>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
