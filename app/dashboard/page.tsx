import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: myJobs }, { data: myProposals }, { data: myContracts }] = await Promise.all([
    supabase.from("jobs").select("id, title, status, proposal_count, created_at")
      .eq("client_id", user.id).order("created_at", { ascending: false }),
    supabase.from("proposals").select("id, status, proposed_amount_jpy, jobs(id, title)")
      .eq("worker_id", user.id).order("created_at", { ascending: false }),
    supabase.from("contracts").select("id, status, amount_jpy, jobs(title)")
      .or(`client_id.eq.${user.id},worker_id.eq.${user.id}`).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">進行中の契約</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {myContracts?.map((c: any) => (
            <div key={c.id} className="card">
              <div className="font-semibold">{c.jobs?.title}</div>
              <div className="text-sm text-slate-600 mt-1">
                ¥{c.amount_jpy.toLocaleString()} · <span className="badge">{c.status}</span>
              </div>
            </div>
          ))}
          {(!myContracts || myContracts.length === 0) && (
            <p className="text-sm text-slate-500">契約はまだありません</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">投稿した案件</h2>
          <Link href="/jobs/new" className="text-sm text-moai-primary hover:underline">+ 新規投稿</Link>
        </div>
        <div className="space-y-2">
          {myJobs?.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`} className="card block hover:shadow-md">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{j.title}</div>
                  <div className="text-xs text-slate-500">応募 {j.proposal_count}件</div>
                </div>
                <span className="badge self-start">{j.status}</span>
              </div>
            </Link>
          ))}
          {(!myJobs || myJobs.length === 0) && <p className="text-sm text-slate-500">投稿した案件はまだありません</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">応募した案件</h2>
        <div className="space-y-2">
          {myProposals?.map((p: any) => (
            <Link key={p.id} href={`/jobs/${p.jobs?.id}`} className="card block hover:shadow-md">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{p.jobs?.title}</div>
                  <div className="text-xs text-slate-500">¥{p.proposed_amount_jpy.toLocaleString()}</div>
                </div>
                <span className="badge self-start">{p.status}</span>
              </div>
            </Link>
          ))}
          {(!myProposals || myProposals.length === 0) && <p className="text-sm text-slate-500">応募した案件はまだありません</p>}
        </div>
      </section>
    </div>
  );
}
