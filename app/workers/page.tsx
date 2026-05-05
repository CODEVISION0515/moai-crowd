import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { MoaiBadge } from "@/components/MoaiBadge";
import { EmptyState } from "@/components/EmptyState";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

const AVAILABILITY_LABEL: Record<string, string> = {
  available: "受注可能",
  limited: "一部受注可",
  busy: "多忙",
  unavailable: "受注停止中",
};

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    skills?: string;
    moai_role?: string;
    cohort?: string;
    availability?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const skillsCsv = sp.skills ?? "";
  const moaiRole = sp.moai_role ?? "";
  const cohortFilter = sp.cohort ? Number(sp.cohort) : null;
  const availability = sp.availability ?? "";

  const sb = await createClient();

  let query = sb
    .from("profiles")
    .select(
      "id, handle, display_name, avatar_url, bio, skills, rating_avg, rating_count, location, hourly_rate_jpy, crowd_role, cohort, moai_badge_display, tagline, availability, verified_identity"
    )
    .eq("is_worker", true)
    .eq("is_suspended", false)
    .order("rating_avg", { ascending: false })
    .limit(60);

  if (q) query = query.textSearch("search_vector", q, { type: "plain", config: "simple" });
  if (skillsCsv) {
    const skillArr = skillsCsv.split(",").map((s) => s.trim()).filter(Boolean);
    if (skillArr.length) query = query.overlaps("skills", skillArr);
  }
  if (moaiRole) query = query.eq("crowd_role", moaiRole);
  if (cohortFilter) query = query.eq("cohort", cohortFilter);
  if (availability) query = query.eq("availability", availability);

  const { data: workers } = await query;

  const { data: cohorts } = await sb.from("cohorts").select("id, name").order("id");

  // スキル集計
  const skillCounts = new Map<string, number>();
  (workers ?? []).forEach((w: any) =>
    (w.skills ?? []).forEach((s: string) => skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1))
  );
  const topSkills = Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 12).map(([s]) => s);

  const buildUrl = (override: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const merged = {
      q,
      skills: skillsCsv,
      moai_role: moaiRole,
      cohort: cohortFilter ? String(cohortFilter) : "",
      availability,
      ...override,
    };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, String(v));
    const s = params.toString();
    return `/workers${s ? `?${s}` : ""}`;
  };

  const hasFilters = !!(q || skillsCsv || moaiRole || cohortFilter || availability);

  return (
    <div className="container-wide py-6 md:py-8 pb-nav">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold">ワーカーを探す</h1>
        <p className="text-xs md:text-sm text-moai-muted mt-1">
          {(workers?.length ?? 0)}人のワーカー · MOAI卒業生は手数料5%（生涯）
        </p>
      </div>

      {/* Search bar */}
      <form action="/workers" method="get" className="mb-5">
        {skillsCsv && <input type="hidden" name="skills" value={skillsCsv} />}
        {moaiRole && <input type="hidden" name="moai_role" value={moaiRole} />}
        {cohortFilter && <input type="hidden" name="cohort" value={cohortFilter} />}
        {availability && <input type="hidden" name="availability" value={availability} />}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="名前・スキル・自己紹介で検索"
            className="w-full rounded-lg border border-moai-border bg-white pl-11 pr-24 py-3 text-sm placeholder:text-slate-400 focus:border-moai-primary focus:outline-none focus:ring-2 focus:ring-moai-primary/10 transition-all"
          />
          <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-accent btn-sm px-4">
            検索
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6">
        {/* LEFT SIDEBAR */}
        <aside className="sidebar-filter">
          {hasFilters && (
            <div className="sidebar-filter-group bg-moai-primary/5 border-moai-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-moai-primary">適用中</span>
                <Link href="/workers" className="text-[10px] text-moai-muted hover:text-moai-ink underline">
                  クリア
                </Link>
              </div>
              <div className="flex flex-wrap gap-1">
                {q && <span className="badge-accent text-[10px]">「{q}」</span>}
                {skillsCsv && <span className="badge-accent text-[10px]">{skillsCsv}</span>}
                {moaiRole && (
                  <span className="badge-accent text-[10px]">
                    {moaiRole === "alumni" ? "🎓 卒業生" : "🌱 在校生"}
                  </span>
                )}
                {cohortFilter && <span className="badge-accent text-[10px]">第{cohortFilter}期</span>}
                {availability && (
                  <span className="badge-accent text-[10px]">{AVAILABILITY_LABEL[availability]}</span>
                )}
              </div>
            </div>
          )}

          {/* MOAI role */}
          <div className="sidebar-filter-group">
            <h3 className="sidebar-filter-title">MOAI属性</h3>
            <div className="space-y-1">
              <Link
                href={buildUrl({ moai_role: null, cohort: null })}
                className={`block px-2 py-1.5 rounded text-sm transition-colors ${
                  !moaiRole && !cohortFilter ? "bg-moai-primary/10 text-moai-primary font-semibold" : "text-moai-muted hover:bg-moai-cloud hover:text-moai-ink"
                }`}
              >
                すべて
              </Link>
              <Link
                href={buildUrl({ moai_role: "alumni", cohort: null })}
                className={`block px-2 py-1.5 rounded text-sm transition-colors ${
                  moaiRole === "alumni" ? "bg-moai-primary/10 text-moai-primary font-semibold" : "text-moai-muted hover:bg-moai-cloud hover:text-moai-ink"
                }`}
              >
                🎓 MOAI卒業生
              </Link>
              <Link
                href={buildUrl({ moai_role: "student", cohort: null })}
                className={`block px-2 py-1.5 rounded text-sm transition-colors ${
                  moaiRole === "student" ? "bg-moai-primary/10 text-moai-primary font-semibold" : "text-moai-muted hover:bg-moai-cloud hover:text-moai-ink"
                }`}
              >
                🌱 MOAI在校生
              </Link>
            </div>
          </div>

          {/* Cohort */}
          {cohorts && cohorts.length > 0 && (
            <div className="sidebar-filter-group">
              <h3 className="sidebar-filter-title">期</h3>
              <div className="flex flex-wrap gap-1.5">
                {cohorts.map((c: any) => {
                  const active = cohortFilter === c.id;
                  return (
                    <Link
                      key={c.id}
                      href={buildUrl({ cohort: active ? null : String(c.id), moai_role: null })}
                      className={active ? "chip chip-active" : "chip"}
                    >
                      第{c.id}期
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Availability */}
          <div className="sidebar-filter-group">
            <h3 className="sidebar-filter-title">受注可否</h3>
            <div className="space-y-1">
              {Object.entries(AVAILABILITY_LABEL).map(([value, label]) => {
                const active = availability === value;
                return (
                  <Link
                    key={value}
                    href={buildUrl({ availability: active ? null : value })}
                    className={`block px-2 py-1.5 rounded text-sm transition-colors ${
                      active ? "bg-moai-primary/10 text-moai-primary font-semibold" : "text-moai-muted hover:bg-moai-cloud hover:text-moai-ink"
                    }`}
                  >
                    {value === "available" && "🟢 "}
                    {value === "limited" && "🟡 "}
                    {value === "busy" && "🟠 "}
                    {value === "unavailable" && "⚫ "}
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Top skills */}
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
        </aside>

        {/* MAIN: Worker grid */}
        <main className="min-w-0">
          {workers && workers.length > 0 ? (
            <div className="cs-grid-3">
              {workers.map((w: any) => (
                <Link key={w.id} href={`/profile/${w.handle}`} className="card-worker group">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <Avatar src={w.avatar_url} name={w.display_name} size={48} />
                      {w.availability === "available" && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" aria-label="受注可能" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-sm truncate group-hover:text-moai-primary transition-colors">
                          {w.display_name}
                        </span>
                        {w.verified_identity && (
                          <span title="本人確認済み" className="text-blue-500 text-xs">✓</span>
                        )}
                      </div>
                      <div className="text-xs text-moai-muted flex items-center gap-1.5 mt-0.5">
                        <span className="text-amber-500">★</span>
                        <span className="font-medium text-moai-ink">{Number(w.rating_avg ?? 0).toFixed(1)}</span>
                        <span>({w.rating_count ?? 0})</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <MoaiBadge crowdRole={w.crowd_role} display={w.moai_badge_display} cohort={w.cohort} />
                  </div>

                  {w.tagline && (
                    <p className="mt-2.5 text-sm font-medium text-moai-ink line-clamp-2 leading-snug">{w.tagline}</p>
                  )}
                  {w.bio && !w.tagline && (
                    <p className="mt-2.5 text-xs text-moai-muted line-clamp-2 leading-relaxed">{w.bio}</p>
                  )}

                  {(w.skills as string[])?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(w.skills as string[]).slice(0, 4).map((s: string) => (
                        <span key={s} className="badge text-[10px]">{s}</span>
                      ))}
                      {(w.skills as string[]).length > 4 && (
                        <span className="badge text-[10px]">+{(w.skills as string[]).length - 4}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-moai-border flex items-center justify-between text-xs">
                    {w.hourly_rate_jpy ? (
                      <div className="text-moai-muted">
                        時給 <span className="font-bold text-moai-ink">¥{w.hourly_rate_jpy.toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="text-moai-muted text-[11px]">時給未設定</div>
                    )}
                    {w.location && (
                      <div className="text-moai-muted text-[11px] truncate max-w-[80px]" title={w.location}>📍 {w.location}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🔍"
              title="該当するワーカーはいません"
              description="条件を変えて再検索してみてください"
            />
          )}
        </main>
      </div>
    </div>
  );
}
