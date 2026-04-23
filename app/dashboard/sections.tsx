import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard, SkeletonLine } from "@/components/Skeleton";
import { formatCurrency } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  open: "badge-accent",
  in_progress: "badge-warning",
  working: "badge-warning",
  completed: "badge-success",
  released: "badge-success",
  cancelled: "badge-slate",
  pending: "badge",
  accepted: "badge-accent",
  rejected: "badge-coral",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "夜遅くまでお疲れさまです";
  if (h < 11) return "おはようございます";
  if (h < 17) return "こんにちは";
  if (h < 22) return "こんばんは";
  return "お疲れさまです";
}

// ── Greeting card ─────────────────────────────────────

export async function GreetingCard({ userId }: { userId: string }) {
  const sb = await createClient();
  const { data: profile } = await sb.from("profiles").select("*").eq("id", userId).single();

  const completion = profile?.profile_completion ?? 0;
  const greeting = getGreeting();

  return (
    <div className="relative overflow-hidden card-flat bg-gradient-to-br from-moai-primary to-moai-primary-900 text-white">
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" aria-hidden="true" />

      <div className="relative flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white/15 flex items-center justify-center text-2xl font-bold ring-2 ring-white/20">
          <Avatar src={profile?.avatar_url} name={profile?.display_name} size={64} priority />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/70 flex items-center gap-2">
            <span>{greeting}</span>
            <span
              className="bg-white/20 backdrop-blur-sm text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide"
              aria-label={`現在のモード: ${profile?.active_mode === "client" ? "発注者" : "受注者"}`}
            >
              {profile?.active_mode === "client" ? "💼 発注者モード" : "🛠️ 受注者モード"}
            </span>
          </div>
          <div className="text-xl font-bold mt-0.5">{profile?.display_name}さん</div>
          <div className="mt-1.5 flex items-center gap-2.5 text-xs">
            <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-semibold">Lv.{profile?.level ?? 1}</span>
            <span className="flex items-center gap-0.5">
              <svg className="h-3 w-3 text-yellow-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              {Number(profile?.rating_avg ?? 0).toFixed(1)}
            </span>
            {profile?.streak_days > 0 && <span className="text-orange-200">🔥 {profile.streak_days}日連続</span>}
          </div>
        </div>
      </div>

      {completion < 100 && (
        <div className="relative mt-5 pt-4 border-t border-white/15">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white/80">プロフィール完成度</span>
            <span className="font-bold">{completion}%</span>
          </div>
          <div className="progress-bar bg-white/15">
            <div className="progress-bar-fill bg-white" style={{ width: `${completion}%` }} />
          </div>
          <Link href="/profile/edit" className="mt-3 inline-flex items-center gap-1 text-xs text-white/90 hover:text-white transition-colors font-medium">
            プロフィールを完成させる
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      )}
    </div>
  );
}

export function GreetingCardSkeleton() {
  return (
    <div className="card-flat bg-gradient-to-br from-moai-primary/70 to-moai-primary-900/70 text-white">
      <div className="flex items-center gap-4">
        <div className="skeleton h-16 w-16 rounded-2xl bg-white/20" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-24 bg-white/20" />
          <div className="skeleton h-5 w-40 bg-white/20" />
          <div className="skeleton h-3 w-28 bg-white/20" />
        </div>
      </div>
    </div>
  );
}

// ── Bank setup banner (受注者で未設定の人に表示) ──────
export async function BankSetupBanner({ userId }: { userId: string }) {
  const sb = await createClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("is_worker, stripe_account_id")
    .eq("id", userId)
    .maybeSingle();

  // 受注者でない、または既に設定済みなら非表示
  if (!profile?.is_worker) return null;

  // stripe_account_id がない = 未開始
  // stripe_account_id があっても details_submitted=false の可能性あるが、
  // ここでは重い fetch は避け、id の有無だけで暫定判定。完全な状態チェックは /bank-setup ページで。
  if (profile.stripe_account_id) return null;

  return (
    <Link
      href="/bank-setup"
      className="card border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/50 hover:shadow-md transition-all block"
    >
      <div className="flex items-center gap-4">
        <div
          className="shrink-0 h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center text-2xl"
          aria-hidden="true"
        >
          🏦
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            受注準備
          </div>
          <div className="font-bold text-sm mt-0.5">振込先の銀行口座を登録しましょう</div>
          <div className="text-xs text-amber-900 mt-0.5">
            3〜5分で完了 · 案件を受注する前に必要です
          </div>
        </div>
        <div className="text-amber-700 text-lg shrink-0" aria-hidden="true">
          →
        </div>
      </div>
    </Link>
  );
}

// ── Cohort banner (student/alumni/lecturer のみ) ──────
export async function CohortBanner({ userId }: { userId: string }) {
  const sb = await createClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("cohort, crowd_role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.cohort) return null;
  if (!profile.crowd_role || !["student", "alumni", "lecturer"].includes(profile.crowd_role)) {
    return null;
  }

  const { data: cohort } = await sb
    .from("cohorts")
    .select("id, name, subtitle")
    .eq("id", profile.cohort)
    .maybeSingle();
  if (!cohort) return null;

  const isStudent = profile.crowd_role === "student";
  const label = isStudent
    ? "あなたの受講中スペース"
    : profile.crowd_role === "alumni"
    ? "卒業した期のスペース"
    : "担当スペース";

  return (
    <Link
      href={`/school/cohort/${cohort.id}`}
      className="card border-2 border-moai-primary/30 bg-gradient-to-br from-moai-primary/5 to-moai-accent/5 hover:shadow-md transition-all block"
    >
      <div className="flex items-center gap-4">
        <div className="shrink-0 h-12 w-12 rounded-xl bg-moai-primary/10 flex items-center justify-center text-2xl" aria-hidden="true">
          🎓
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-moai-primary uppercase tracking-wider">
            {label}
          </div>
          <div className="font-bold text-sm mt-0.5 truncate">{cohort.name}</div>
          {cohort.subtitle && (
            <div className="text-xs text-moai-muted truncate">{cohort.subtitle}</div>
          )}
        </div>
        <div className="text-moai-primary text-lg shrink-0" aria-hidden="true">
          →
        </div>
      </div>
    </Link>
  );
}

// ── Getting started checklist ─────────────────────────
// 新規ユーザー向けに「次にすべきこと」を可視化。完了したら自動で消える。

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
};

export async function GettingStarted({ userId }: { userId: string }) {
  const sb = await createClient();

  const [
    { data: profile },
    { count: postCount },
    { count: jobCount },
    { count: proposalCount },
  ] = await Promise.all([
    sb.from("profiles").select("avatar_url, bio, skills, profile_completion, github_username, is_worker, is_client, stripe_account_id, active_mode").eq("id", userId).single(),
    sb.from("posts").select("*", { count: "exact", head: true }).eq("author_id", userId),
    sb.from("jobs").select("*", { count: "exact", head: true }).eq("client_id", userId),
    sb.from("proposals").select("*", { count: "exact", head: true }).eq("worker_id", userId),
  ]);

  if (!profile) return null;

  const activeMode = (profile.active_mode ?? "worker") as "worker" | "client";

  const commonItems: ChecklistItem[] = [
    {
      id: "avatar",
      label: "プロフィール写真を設定",
      description: "顔写真があると信頼度UP",
      href: "/profile/edit",
      done: !!profile.avatar_url,
    },
    {
      id: "bio",
      label: "自己紹介を書く",
      description: "あなたの強みを伝えよう",
      href: "/profile/edit",
      done: !!profile.bio && profile.bio.trim().length >= 30,
    },
    {
      id: "skills",
      label: "スキルを追加",
      description: "マッチング精度UP",
      href: "/profile/edit",
      done: Array.isArray(profile.skills) && profile.skills.length > 0,
    },
  ];

  const workerItems: ChecklistItem[] = [
    {
      id: "bank_setup",
      label: "振込先口座を登録",
      description: "受注する前に必要 · 3〜5分で完了",
      href: "/bank-setup",
      done: !!profile.stripe_account_id,
    },
    {
      id: "first_proposal",
      label: "最初の案件に応募",
      description: "受注実績の第一歩",
      href: "/jobs",
      done: (proposalCount ?? 0) > 0,
    },
  ];

  const clientItems: ChecklistItem[] = [
    {
      id: "first_job",
      label: "最初の案件を投稿",
      description: "AIで下書きが作れます",
      href: "/jobs/new",
      done: (jobCount ?? 0) > 0,
    },
  ];

  const communityItem: ChecklistItem = {
    id: "first_post",
    label: "コミュニティで最初の投稿",
    description: "自己紹介してみよう (+10 XP)",
    href: "/community/new",
    done: (postCount ?? 0) > 0,
  };

  // アクティブモードに応じた並び順: 現モード→共通→反対モード→コミュニティ
  const items: ChecklistItem[] =
    activeMode === "client"
      ? [...clientItems, ...commonItems, ...workerItems, communityItem]
      : [...workerItems, ...commonItems, ...clientItems, communityItem];

  const doneCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const allDone = doneCount === totalCount;

  if (allDone) return null; // 全部済んだら非表示

  const progressPct = Math.round((doneCount / totalCount) * 100);

  return (
    <section>
      <div className="card border-2 border-moai-primary/20 bg-gradient-to-br from-moai-primary/[0.03] to-transparent">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span aria-hidden="true">🚀</span>
              {activeMode === "client" ? "発注者として始める" : "受注者として始める"}
            </h2>
            <p className="text-xs text-moai-muted mt-1">
              {activeMode === "client"
                ? "案件を投稿して、仲間に手伝ってもらおう"
                : "下のステップを完了して、初受注までの道を進もう"}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-moai-primary">{doneCount}<span className="text-base text-moai-muted">/{totalCount}</span></div>
            <div className="text-[10px] text-moai-muted uppercase tracking-wide">完了</div>
          </div>
        </div>

        <div className="progress-bar mb-4">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>

        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  item.done
                    ? "bg-emerald-50/50 hover:bg-emerald-50"
                    : "bg-white hover:bg-moai-cloud border border-moai-border"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`shrink-0 mt-0.5 flex items-center justify-center h-5 w-5 rounded-full text-xs ${
                    item.done
                      ? "bg-emerald-500 text-white"
                      : "border-2 border-moai-border bg-white"
                  }`}
                >
                  {item.done && (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${item.done ? "text-moai-muted line-through" : "text-moai-ink"}`}>
                    {item.label}
                  </div>
                  <div className="text-xs text-moai-muted mt-0.5">{item.description}</div>
                </div>
                {!item.done && (
                  <span className="text-xs text-moai-primary font-medium shrink-0 mt-1">→</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function GettingStartedSkeleton() {
  return (
    <div className="card space-y-3">
      <SkeletonLine className="h-5 w-48" />
      <SkeletonLine className="h-3 w-32" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton h-5 w-5 rounded-full" />
          <SkeletonLine className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

// ── Stats + Quick actions ─────────────────────────────

export async function StatsAndActions({ userId }: { userId: string }) {
  const sb = await createClient();
  const [
    activeContractsRes,
    jobsCountRes,
    pendingProposalsRes,
    unreadNotifsRes,
    unreadMsgsRes,
  ] = await Promise.all([
    sb.from("contracts").select("*", { count: "exact", head: true })
      .or(`client_id.eq.${userId},worker_id.eq.${userId}`)
      .in("status", ["working", "in_progress", "funded"]),
    sb.from("jobs").select("*", { count: "exact", head: true }).eq("client_id", userId),
    sb.from("proposals").select("*", { count: "exact", head: true }).eq("worker_id", userId).eq("status", "pending"),
    sb.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
    sb.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null).eq("title", "新しいメッセージ"),
  ]);

  const activeCount = activeContractsRes.count ?? 0;
  const jobsCount = jobsCountRes.count ?? 0;
  const pendingCount = pendingProposalsRes.count ?? 0;
  const unreadNotifs = unreadNotifsRes.count ?? 0;
  const unreadMsgs = unreadMsgsRes.count ?? 0;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="stat-card-label">進行中の契約</div>
          <div className="stat-card-value">{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">投稿した案件</div>
          <div className="stat-card-value">{jobsCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">応募中</div>
          <div className="stat-card-value">{pendingCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">未読通知</div>
          <div className={`stat-card-value ${unreadNotifs > 0 ? "text-moai-primary" : ""}`}>{unreadNotifs}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction href="/jobs" icon="🔍" label="案件を探す" desc="新着案件をチェック" />
        <QuickAction href="/jobs/new" icon="📝" label="案件を依頼" desc="仕事を発注する" highlight />
        <QuickAction href="/messages" icon="💬" label="メッセージ" desc={unreadMsgs ? `${unreadMsgs}件の未読` : "やり取りを確認"} />
        <QuickAction href="/notifications" icon="🔔" label="通知" desc={unreadNotifs ? `${unreadNotifs}件の新着` : "すべて既読"} />
      </div>
    </>
  );
}

export function StatsAndActionsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="stat-card">
            <SkeletonLine className="h-3 w-20" />
            <SkeletonLine className="h-6 w-12 mt-2" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card space-y-2">
            <SkeletonLine className="h-4 w-24" />
            <SkeletonLine className="h-3 w-16" />
          </div>
        ))}
      </div>
    </>
  );
}

function QuickAction({ href, icon, label, desc, highlight }: { href: string; icon: string; label: string; desc?: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`card-interactive flex items-start gap-3 group ${highlight ? "border-moai-primary/30 bg-moai-primary/[0.03]" : ""}`}
    >
      <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <div className="font-medium text-sm">{label}</div>
        {desc && <div className="text-[11px] text-moai-muted mt-0.5">{desc}</div>}
      </div>
    </Link>
  );
}

// ── Active contracts ──────────────────────────────────

export async function ActiveContractsSection({ userId }: { userId: string }) {
  const sb = await createClient();
  const { data: contracts } = await sb
    .from("contracts")
    .select("id, status, amount_jpy, jobs(title)")
    .or(`client_id.eq.${userId},worker_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <Section title="進行中の契約" link="/dashboard">
      {contracts && contracts.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-3">
          {contracts.map((c: any) => {
            const statusClass = STATUS_STYLES[c.status] ?? "badge";
            return (
              <Link key={c.id} href={`/contracts/${c.id}`} className="card-hover">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm line-clamp-1 flex-1">{c.jobs?.title}</div>
                  <span className={`${statusClass} shrink-0 text-[11px]`}>{c.status}</span>
                </div>
                <div className="mt-2 text-sm font-semibold">{formatCurrency(c.amount_jpy)}</div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState icon="📋" title="契約はまだありません" description="案件に応募・採用されると契約が始まります" />
      )}
    </Section>
  );
}

// ── My posted jobs ────────────────────────────────────

export async function MyJobsSection({ userId }: { userId: string }) {
  const sb = await createClient();
  const { data: myJobs } = await sb
    .from("jobs")
    .select("id, title, status, proposal_count")
    .eq("client_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <Section title="投稿した案件" link="/jobs/new" linkLabel="+ 新規投稿">
      {myJobs && myJobs.length > 0 ? (
        <div className="space-y-2">
          {myJobs.map((j) => {
            const statusClass = STATUS_STYLES[j.status] ?? "badge";
            return (
              <Link key={j.id} href={`/jobs/${j.id}`} className="card-hover block">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm line-clamp-1 flex-1">{j.title}</div>
                  <span className={`${statusClass} text-[11px] shrink-0`}>{j.status}</span>
                </div>
                <div className="text-xs text-moai-muted mt-1.5">応募 {j.proposal_count}件</div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState icon="📤" title="まだ投稿していません" action={{ href: "/jobs/new", label: "案件を投稿" }} />
      )}
    </Section>
  );
}

// ── My proposals ──────────────────────────────────────

export async function MyProposalsSection({ userId }: { userId: string }) {
  const sb = await createClient();
  const { data: proposals } = await sb
    .from("proposals")
    .select("id, status, proposed_amount_jpy, jobs(id, title)")
    .eq("worker_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <Section title="応募した案件">
      {proposals && proposals.length > 0 ? (
        <div className="space-y-2">
          {proposals.map((p: any) => {
            const statusClass = STATUS_STYLES[p.status] ?? "badge";
            return (
              <Link key={p.id} href={`/jobs/${p.jobs?.id}`} className="card-hover block">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm line-clamp-1 flex-1">{p.jobs?.title}</div>
                  <span className={`${statusClass} text-[11px] shrink-0`}>{p.status}</span>
                </div>
                <div className="text-xs text-moai-muted mt-1.5">提案 {formatCurrency(p.proposed_amount_jpy)}</div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState icon="📥" title="まだ応募していません" action={{ href: "/jobs", label: "案件を探す" }} />
      )}
    </Section>
  );
}

export function SectionListSkeleton({ title }: { title: string }) {
  return (
    <Section title={title}>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </Section>
  );
}

// ── Community highlights (hot posts + unread social notifications) ──

const POST_KIND_META: Record<string, { icon: string; label: string; color: string }> = {
  discussion: { icon: "💬", label: "ディスカッション", color: "bg-blue-50 text-blue-700" },
  question: { icon: "❓", label: "質問", color: "bg-amber-50 text-amber-700" },
  showcase: { icon: "🎨", label: "作品シェア", color: "bg-purple-50 text-purple-700" },
  announcement: { icon: "📣", label: "お知らせ", color: "bg-red-50 text-red-700" },
};

export async function CommunityHighlights({ userId }: { userId: string }) {
  const sb = await createClient();
  // 24時間以内 or hot_score 上位から5件、さらに「自分宛のソーシャル未読通知」も取得
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [hotRes, unreadSocialRes] = await Promise.all([
    sb
      .from("posts")
      .select("id, title, kind, hot_score, comment_count, like_count, created_at, author:author_id(handle, display_name, avatar_url)")
      .gte("created_at", since)
      .order("hot_score", { ascending: false })
      .limit(5),
    sb
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null)
      .in("kind", ["post_commented", "post_liked", "comment_replied", "new_follower", "mentioned_in_comment", "mentioned_in_post", "post_answer_accepted"]),
  ]);

  const posts = hotRes.data ?? [];
  const unreadSocial = unreadSocialRes.count ?? 0;

  return (
    <Section title="🔥 コミュニティの動き" link="/community" linkLabel="もっと見る">
      {unreadSocial > 0 && (
        <Link
          href="/notifications"
          className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-moai-primary/5 border border-moai-primary/20 hover:bg-moai-primary/10 transition-colors"
        >
          <span aria-hidden="true">🔔</span>
          <span className="text-sm font-medium">
            あなた宛の<strong className="text-moai-primary">新着 {unreadSocial} 件</strong> のコミュニティ通知があります
          </span>
          <span className="ml-auto text-xs text-moai-primary">→</span>
        </Link>
      )}

      {posts.length > 0 ? (
        <div className="space-y-2">
          {posts.map((p: any) => {
            const meta = POST_KIND_META[p.kind] ?? POST_KIND_META.discussion;
            return (
              <Link key={p.id} href={`/community/${p.id}`} className="card-hover block">
                <div className="flex items-start gap-3">
                  <span className="h-8 w-8 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-xs font-semibold text-moai-muted shrink-0">
                    <Avatar src={p.author?.avatar_url} name={p.author?.display_name} size={32} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`badge text-[10px] ${meta.color}`}>{meta.icon} {meta.label}</span>
                      <span className="text-[10px] text-moai-muted">by {p.author?.display_name}</span>
                    </div>
                    <div className="mt-1 text-sm font-medium line-clamp-1">{p.title}</div>
                    <div className="mt-1 text-[11px] text-moai-muted flex gap-3">
                      <span>💬 {p.comment_count ?? 0}</span>
                      <span>👍 {p.like_count ?? 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="💡"
          title="直近24時間のトレンドはまだありません"
          description="最初の話題を投稿してみませんか？"
          action={{ href: "/community/new", label: "投稿する" }}
        />
      )}
    </Section>
  );
}

export function CommunityHighlightsSkeleton() {
  return (
    <Section title="🔥 コミュニティの動き">
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </Section>
  );
}

// ── Shared ────────────────────────────────────────────

function Section({ title, link, linkLabel, children }: { title: string; link?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="section-header mb-3">
        <h2 className="section-title">{title}</h2>
        {link && <Link href={link} className="section-link text-xs">{linkLabel ?? "すべて見る"}</Link>}
      </div>
      {children}
    </section>
  );
}
