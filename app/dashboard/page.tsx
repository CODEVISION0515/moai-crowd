import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RecommendedJobs from "@/components/RecommendedJobs";

export const dynamic = "force-dynamic";

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
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("jobs").select("id, title, status, proposal_count, created_at").eq("client_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("proposals").select("id, status, proposed_amount_jpy, jobs(id, title)").eq("worker_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("contracts").select("id, status, amount_jpy, jobs(title)").or(`client_id.eq.${user.id},worker_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(5),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);

  const completion = profile?.profile_completion ?? 0;
  const greeting = getGreeting();

  return (
    <div className="container-app py-6 md:py-10 space-y-6">
      {/* Greeting card */}
      <div className="card-flat bg-gradient-to-br from-moai-primary to-teal-700 text-white">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/30">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : (profile?.display_name?.[0] ?? "?")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white/80">{greeting}</div>
            <div className="text-xl font-bold">{profile?.display_name}さん</div>
            <div className="mt-1 text-xs flex items-center gap-3">
              <span className="bg-moai-accent/90 px-2 py-0.5 rounded-full font-semibold">Lv.{profile?.level ?? 1}</span>
              <span>★ {Number(profile?.rating_avg ?? 0).toFixed(1)}</span>
              {profile?.streak_days > 0 && <span>🔥 {profile.streak_days}日</span>}
            </div>
          </div>
        </div>

        {completion < 100 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex justify-between text-xs mb-1">
              <span>プロフィール完成度</span>
              <span className="font-bold">{completion}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white transition-all" style={{ width: `${completion}%` }} />
            </div>
            <Link href="/profile/edit" className="mt-3 inline-flex text-xs underline">プロフィールを完成させる →</Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction href="/jobs" icon="🔍" label="案件を探す" />
        <QuickAction href="/jobs/new" icon="📝" label="案件を依頼" highlight />
        <QuickAction href="/messages" icon="💬" label="メッセージ" />
        <QuickAction href="/notifications" icon="🔔" label={`通知 ${unreadNotifs.count ? `(${unreadNotifs.count})` : ""}`} />
      </div>

      {/* AI推薦 */}
      <RecommendedJobs />

      {/* セクション: 進行中の契約 */}
      <Section title="進行中の契約" link="/dashboard">
        {myContracts && myContracts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-3">
            {myContracts.map((c: any) => (
              <Link key={c.id} href={`/contracts/${c.id}`} className="card-hover">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold line-clamp-1">{c.jobs?.title}</div>
                  <span className="badge shrink-0">{c.status}</span>
                </div>
                <div className="mt-2 text-sm text-slate-500">¥{c.amount_jpy.toLocaleString()}</div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty text="契約はまだありません" />
        )}
      </Section>

      <div className="grid md:grid-cols-2 gap-6">
        <Section title="📤 投稿した案件" link="/jobs/new" linkLabel="+ 新規">
          {myJobs && myJobs.length > 0 ? (
            <div className="space-y-2">
              {myJobs.map((j) => (
                <Link key={j.id} href={`/jobs/${j.id}`} className="card-hover block">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium line-clamp-1">{j.title}</div>
                    <span className="badge text-xs shrink-0">{j.status}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">応募 {j.proposal_count}件</div>
                </Link>
              ))}
            </div>
          ) : (
            <Empty text="まだ投稿していません" />
          )}
        </Section>

        <Section title="📥 応募した案件">
          {myProposals && myProposals.length > 0 ? (
            <div className="space-y-2">
              {myProposals.map((p: any) => (
                <Link key={p.id} href={`/jobs/${p.jobs?.id}`} className="card-hover block">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium line-clamp-1">{p.jobs?.title}</div>
                    <span className="badge text-xs shrink-0">{p.status}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">提案 ¥{p.proposed_amount_jpy.toLocaleString()}</div>
                </Link>
              ))}
            </div>
          ) : (
            <Empty text="まだ応募していません" />
          )}
        </Section>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "夜遅くまでお疲れさまです 🌙";
  if (h < 11) return "おはようございます ☀️";
  if (h < 17) return "こんにちは 👋";
  if (h < 22) return "こんばんは 🌆";
  return "お疲れさまです 🌙";
}

function QuickAction({ href, icon, label, highlight }: { href: string; icon: string; label: string; highlight?: boolean }) {
  return (
    <Link href={href} className={`card-hover flex items-center gap-3 ${highlight ? "border-moai-accent bg-moai-accent/5" : ""}`}>
      <span className="text-2xl">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}

function Section({ title, link, linkLabel, children }: { title: string; link?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="section-title">{title}</h2>
        {link && <Link href={link} className="text-xs text-moai-primary hover:underline">{linkLabel ?? "すべて見る →"}</Link>}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 text-center py-6">{text}</p>;
}
