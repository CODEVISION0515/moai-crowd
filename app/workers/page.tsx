import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { MoaiBadge } from "@/components/MoaiBadge";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    skills?: string;
    moai_role?: string;
    cohort?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const skillsCsv = sp.skills ?? "";
  const moaiRole = sp.moai_role ?? "";
  const cohortFilter = sp.cohort ? Number(sp.cohort) : null;

  const sb = await createClient();

  let query = sb
    .from("profiles")
    .select(
      "id, handle, display_name, avatar_url, bio, skills, rating_avg, rating_count, location, hourly_rate_jpy, crowd_role, cohort, moai_badge_display, tagline"
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

  const { data: workers } = await query;

  const { data: cohorts } = await sb.from("cohorts").select("id, name").order("id");

  const buildUrl = (params: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const merged = { q, skills: skillsCsv, moai_role: moaiRole, cohort: cohortFilter ? String(cohortFilter) : "", ...params };
    for (const [k, v] of Object.entries(merged)) if (v) u.set(k, String(v));
    const s = u.toString();
    return `/workers${s ? `?${s}` : ""}`;
  };

  return (
    <div className="container-app max-w-6xl py-10 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">受注者を探す</h1>
        <p className="mt-1 text-sm text-moai-muted">
          MOAI卒業生は業界最安級の手数料（5%生涯）で受注します
        </p>
      </header>

      {/* Search */}
      <form className="card flex flex-wrap gap-2">
        <input name="q" defaultValue={q} className="input flex-1 min-w-[200px]" placeholder="名前・スキル・自己紹介で検索" />
        <input name="skills" defaultValue={skillsCsv} className="input max-w-xs" placeholder="スキル(カンマ区切り)" />
        {moaiRole && <input type="hidden" name="moai_role" value={moaiRole} />}
        {cohortFilter && <input type="hidden" name="cohort" value={cohortFilter} />}
        <button className="btn-primary">検索</button>
      </form>

      {/* MOAI filters */}
      <div className="flex flex-wrap gap-1.5">
        <Link
          href={buildUrl({ moai_role: undefined, cohort: undefined })}
          className={`chip ${!moaiRole && !cohortFilter ? "chip-active" : ""}`}
        >
          すべて
        </Link>
        <Link
          href={buildUrl({ moai_role: "alumni", cohort: undefined })}
          className={`chip ${moaiRole === "alumni" ? "chip-active" : ""}`}
        >
          🎓 MOAI卒業生
        </Link>
        <Link
          href={buildUrl({ moai_role: "student", cohort: undefined })}
          className={`chip ${moaiRole === "student" ? "chip-active" : ""}`}
        >
          🌱 MOAI在校生
        </Link>
        {cohorts?.map((c: any) => (
          <Link
            key={c.id}
            href={buildUrl({ cohort: String(c.id), moai_role: undefined })}
            className={`chip ${cohortFilter === c.id ? "chip-active" : ""}`}
          >
            第{c.id}期
          </Link>
        ))}
      </div>

      {/* Results */}
      {workers && workers.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((w: any) => (
            <Link key={w.id} href={`/profile/${w.handle}`} className="card hover:shadow-md transition group">
              <div className="flex items-center gap-3">
                <span className="h-12 w-12 rounded-full overflow-hidden bg-moai-primary/10 flex items-center justify-center font-bold text-moai-primary shrink-0">
                  <Avatar src={w.avatar_url} name={w.display_name} size={48} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate group-hover:text-moai-primary transition-colors">{w.display_name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>★ {Number(w.rating_avg).toFixed(1)} ({w.rating_count})</span>
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <MoaiBadge crowdRole={w.crowd_role} display={w.moai_badge_display} cohort={w.cohort} />
              </div>
              {w.tagline && <p className="mt-2 text-sm font-medium text-moai-ink line-clamp-1">{w.tagline}</p>}
              {w.bio && <p className="mt-1 text-xs text-slate-600 line-clamp-2">{w.bio}</p>}
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
        </div>
      ) : (
        <EmptyState
          icon="🔍"
          title="該当する受注者はいません"
          description="条件を変えて再検索してみてください"
        />
      )}
    </div>
  );
}
