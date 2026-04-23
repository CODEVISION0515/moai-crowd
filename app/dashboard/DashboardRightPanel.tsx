import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RankBadge } from "@/components/RankBadge";
import { RANK_META, progressToNextRank, type Rank } from "@/lib/ranks";

type ActiveMode = "worker" | "client";

// ── Profile Completion Mini Card ──────────────────────
async function ProfileCompletionMini({ userId }: { userId: string }) {
  const sb = await createClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("profile_completion, avatar_url, bio, skills, stripe_account_id, handle, display_name, tagline")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;

  const completion = profile.profile_completion ?? 0;

  // 未完了項目の抽出
  const undone: { label: string; href: string }[] = [];
  if (!profile.avatar_url) undone.push({ label: "プロフィール写真", href: "/profile/edit" });
  if (!profile.bio || profile.bio.trim().length < 30)
    undone.push({ label: "自己紹介", href: "/profile/edit" });
  if (!Array.isArray(profile.skills) || profile.skills.length === 0)
    undone.push({ label: "スキル", href: "/profile/edit" });
  if (!profile.tagline) undone.push({ label: "キャッチコピー", href: "/profile/edit" });
  if (!profile.stripe_account_id)
    undone.push({ label: "振込先口座", href: "/bank-setup" });

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold">プロフィール完成度</h3>
        <span className="text-xl font-bold text-moai-primary">
          {completion}<span className="text-xs text-moai-muted">%</span>
        </span>
      </div>
      <div className="progress-bar mb-3">
        <div
          className="progress-bar-fill"
          style={{ width: `${completion}%` }}
        />
      </div>

      {undone.length > 0 ? (
        <>
          <div className="text-[10px] uppercase tracking-wide text-moai-muted font-semibold mb-1.5">
            未完了 {undone.length}件
          </div>
          <ul className="space-y-1">
            {undone.slice(0, 4).map((item, i) => (
              <li key={i}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-moai-ink hover:bg-moai-cloud/60 transition-colors"
                >
                  <span className="shrink-0 h-4 w-4 rounded-full border border-moai-border" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          {profile.handle && (
            <Link
              href="/profile/edit"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-moai-primary hover:underline"
            >
              プロフィールを編集 →
            </Link>
          )}
        </>
      ) : (
        <div className="rounded-lg bg-emerald-50 text-emerald-700 text-xs text-center py-2 font-semibold">
          ✓ プロフィール完成
        </div>
      )}
    </section>
  );
}

// ── Stats Mini Card ────────────────────────────────────
async function StatsMini({ userId, activeMode }: { userId: string; activeMode: ActiveMode }) {
  const sb = await createClient();
  const [{ count: proposalCount }, { count: jobCount }, { count: contractCount }, { data: profile }] =
    await Promise.all([
      sb.from("proposals").select("*", { count: "exact", head: true }).eq("worker_id", userId),
      sb.from("jobs").select("*", { count: "exact", head: true }).eq("client_id", userId),
      sb
        .from("contracts")
        .select("*", { count: "exact", head: true })
        .or(`worker_id.eq.${userId},client_id.eq.${userId}`),
      sb
        .from("profiles")
        .select("rating_avg, rating_count, level, streak_days")
        .eq("id", userId)
        .maybeSingle(),
    ]);

  type Row = { label: string; value: string | number; href?: string };
  const rows: Row[] =
    activeMode === "client"
      ? [
          { label: "投稿した案件", value: jobCount ?? 0, href: "/dashboard" },
          { label: "契約", value: contractCount ?? 0 },
          { label: "評価", value: Number(profile?.rating_avg ?? 0).toFixed(1) },
        ]
      : [
          { label: "応募した案件", value: proposalCount ?? 0, href: "/dashboard" },
          { label: "契約", value: contractCount ?? 0 },
          { label: "評価", value: Number(profile?.rating_avg ?? 0).toFixed(1) },
          { label: "連続ログイン", value: `${profile?.streak_days ?? 0}日` },
        ];

  return (
    <section className="card">
      <h3 className="text-sm font-bold mb-3">実績サマリー</h3>
      <dl className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <dt className="text-moai-muted">{r.label}</dt>
            <dd className="font-bold text-moai-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
      {profile && profile.level && (
        <div className="mt-3 pt-3 border-t border-moai-border flex items-center justify-between">
          <span className="text-xs text-moai-muted">レベル</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-moai-primary/10 text-moai-primary px-2 py-0.5 rounded-full">
            Lv.{profile.level}
          </span>
        </div>
      )}
    </section>
  );
}

// ── Rank Mini (ランク制度) ────────────────────────────
async function RankMini({ userId }: { userId: string }) {
  const sb = await createClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("rank, profile_completion, rating_count, rating_avg")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;

  const rank = (profile.rank ?? "regular") as Rank;
  const meta = RANK_META[rank];
  const progress = progressToNextRank(rank, {
    profile_completion: profile.profile_completion ?? 0,
    rating_count: profile.rating_count ?? 0,
    rating_avg: Number(profile.rating_avg ?? 0),
  });

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold">あなたのランク</h3>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-2xl" aria-hidden="true">{meta.icon}</span>
            <span className="font-bold">{meta.label}</span>
          </div>
        </div>
        <RankBadge rank={rank} size="xs" />
      </div>
      <p className="text-[11px] text-moai-muted leading-relaxed">{meta.description}</p>

      {progress.next ? (
        <>
          <div className="mt-3 flex items-center justify-between text-[10px] text-moai-muted">
            <span>次: {RANK_META[progress.next].label}</span>
            <span className="font-semibold text-moai-primary">{progress.progress}%</span>
          </div>
          <div className="progress-bar mt-1">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          {progress.missing.length > 0 && (
            <ul className="mt-2 space-y-1">
              {progress.missing.map((m, i) => (
                <li key={i} className="flex items-center justify-between text-[11px]">
                  <span className="text-moai-muted">{m.label}</span>
                  <span>
                    <span className="text-moai-ink font-medium">{m.current}</span>
                    <span className="text-moai-muted"> / {m.required}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="mt-3 rounded-lg bg-cyan-50 text-cyan-800 text-xs text-center py-2 font-semibold">
          ✨ 最上位ランク到達
        </div>
      )}
    </section>
  );
}

// ── Cohort Mini (学生/卒業生向け) ─────────────────────
async function CohortMini({ userId }: { userId: string }) {
  const sb = await createClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("crowd_role, cohort, graduation_date, moai_badge_display")
    .eq("id", userId)
    .maybeSingle();
  if (!profile || !profile.moai_badge_display) return null;
  if (profile.crowd_role !== "student" && profile.crowd_role !== "alumni") return null;

  return (
    <section className="card bg-gradient-to-br from-moai-primary/5 to-moai-accent/5 border border-moai-primary/20">
      <div className="flex items-start gap-3">
        <div className="text-2xl" aria-hidden="true">
          {profile.crowd_role === "alumni" ? "🎓" : "🌱"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-moai-ink">
            {profile.crowd_role === "alumni" ? "MOAI卒業生" : "MOAI在校生"}
            {profile.cohort ? `・第${profile.cohort}期` : ""}
          </div>
          <div className="text-xs text-moai-muted mt-0.5">
            {profile.crowd_role === "alumni"
              ? "卒業生バッジが提案欄で光ります"
              : "スクール仲間と繋がろう"}
          </div>
          {profile.cohort && (
            <Link
              href={`/school/cohort/${profile.cohort}`}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-moai-primary hover:underline"
            >
              同期のページへ →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Community Highlights Mini ──────────────────────────
async function CommunityMini() {
  const sb = await createClient();
  const { data: posts } = await sb
    .from("posts")
    .select("id, title, author_id, profiles:author_id(display_name)")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(3);

  if (!posts || posts.length === 0) return null;

  return (
    <section className="card">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5">
        <span aria-hidden="true">🌱</span>
        コミュニティ
      </h3>
      <ul className="space-y-2">
        {posts.map((p: any) => (
          <li key={p.id}>
            <Link
              href={`/community/${p.id}`}
              className="block rounded-md px-2 py-1.5 hover:bg-moai-cloud/60 transition-colors"
            >
              <div className="text-xs font-medium text-moai-ink truncate">{p.title}</div>
              <div className="text-[10px] text-moai-muted">
                {p.profiles?.display_name ?? "匿名"}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/community"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-moai-primary hover:underline"
      >
        すべて見る →
      </Link>
    </section>
  );
}

// ── Entry: Right panel aggregator ────────────────────
export default async function DashboardRightPanel({
  userId,
  activeMode,
}: {
  userId: string;
  activeMode: ActiveMode;
}) {
  return (
    <aside className="hidden lg:block lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:self-start w-72 space-y-4">
      <ProfileCompletionMini userId={userId} />
      <RankMini userId={userId} />
      <StatsMini userId={userId} activeMode={activeMode} />
      <CohortMini userId={userId} />
      <CommunityMini />
    </aside>
  );
}
