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
          <div className="text-xs text-white/70">{greeting}</div>
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
