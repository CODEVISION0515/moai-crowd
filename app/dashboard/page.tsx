import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RecommendedJobs from "@/components/RecommendedJobs";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    { data: profile },
    { data: myJobs },
    { data: myProposals },
    { data: myContracts },
    unreadNotifs,
    { count: unreadMsgs },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("jobs").select("id, title, status, proposal_count, created_at").eq("client_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("proposals").select("id, status, proposed_amount_jpy, jobs(id, title)").eq("worker_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("contracts").select("id, status, amount_jpy, jobs(title)").or(`client_id.eq.${user.id},worker_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(5),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null).eq("title", "新しいメッセージ"),
  ]);

  const completion = profile?.profile_completion ?? 0;
  const greeting = getGreeting();
  const activeContracts = myContracts?.filter((c: any) => ["working", "in_progress", "funded"].includes(c.status)) ?? [];

  return (
    <div className="container-app py-6 md:py-10 pb-nav space-y-6">
      {/* ── Greeting card ── */}
      <div className="relative overflow-hidden card-flat bg-gradient-to-br from-moai-primary to-moai-primary-900 text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white/15 flex items-center justify-center text-2xl font-bold ring-2 ring-white/20">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : (profile?.display_name?.[0] ?? "?")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white/70">{greeting}</div>
            <div className="text-xl font-bold mt-0.5">{profile?.display_name}さん</div>
            <div className="mt-1.5 flex items-center gap-2.5 text-xs">
              <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-semibold">Lv.{profile?.level ?? 1}</span>
              <span className="flex items-center gap-0.5">
                <svg className="h-3 w-3 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
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
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="stat-card-label">進行中の契約</div>
          <div className="stat-card-value">{activeContracts.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">投稿した案件</div>
          <div className="stat-card-value">{myJobs?.length ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">応募中</div>
          <div className="stat-card-value">{myProposals?.filter((p: any) => p.status === "pending").length ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">未読通知</div>
          <div className={`stat-card-value ${(unreadNotifs.count ?? 0) > 0 ? "text-moai-primary" : ""}`}>{unreadNotifs.count ?? 0}</div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction href="/jobs" icon="🔍" label="案件を探す" desc="新着案件をチェック" />
        <QuickAction href="/jobs/new" icon="📝" label="案件を依頼" desc="仕事を発注する" highlight />
        <QuickAction href="/messages" icon="💬" label="メッセージ" desc={unreadMsgs ? `${unreadMsgs}件の未読` : "やり取りを確認"} />
        <QuickAction href="/notifications" icon="🔔" label="通知" desc={unreadNotifs.count ? `${unreadNotifs.count}件の新着` : "すべて既読"} />
      </div>

      {/* ── AI推薦 ── */}
      <RecommendedJobs />

      {/* ── 進行中の契約 ── */}
      <Section title="進行中の契約" link="/dashboard">
        {myContracts && myContracts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-3">
            {myContracts.map((c: any) => {
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
          <Empty text="契約はまだありません" icon="📋" />
        )}
      </Section>

      {/* ── 投稿 / 応募 ── */}
      <div className="grid md:grid-cols-2 gap-6">
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
            <Empty text="まだ投稿していません" icon="📤" />
          )}
        </Section>

        <Section title="応募した案件">
          {myProposals && myProposals.length > 0 ? (
            <div className="space-y-2">
              {myProposals.map((p: any) => {
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
            <Empty text="まだ応募していません" icon="📥" />
          )}
        </Section>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "夜遅くまでお疲れさまです";
  if (h < 11) return "おはようございます";
  if (h < 17) return "こんにちは";
  if (h < 22) return "こんばんは";
  return "お疲れさまです";
}

function QuickAction({ href, icon, label, desc, highlight }: { href: string; icon: string; label: string; desc?: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`card-interactive flex items-start gap-3 group ${highlight ? "border-moai-primary/30 bg-moai-primary/[0.03]" : ""}`}
    >
      <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">{icon}</span>
      <div className="min-w-0">
        <div className="font-medium text-sm">{label}</div>
        {desc && <div className="text-[11px] text-moai-muted mt-0.5">{desc}</div>}
      </div>
    </Link>
  );
}

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

function Empty({ text, icon }: { text: string; icon?: string }) {
  return (
    <div className="empty-state py-8">
      {icon && <div className="text-2xl mb-1">{icon}</div>}
      <div className="text-sm text-moai-muted">{text}</div>
    </div>
  );
}
