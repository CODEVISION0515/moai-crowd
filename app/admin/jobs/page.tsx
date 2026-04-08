import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function cancelJob(formData: FormData) {
  "use server";
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  await admin.from("jobs").update({ status: "canceled" }).eq("id", id);
  await admin.from("audit_logs").insert({
    actor_id: user.id, action: "job.cancel", target_kind: "job", target_id: id,
  });
  revalidatePath("/admin/jobs");
}

export default async function AdminJobsPage() {
  const admin = createAdminClient();
  const { data: jobs } = await admin
    .from("jobs")
    .select("id, title, category, status, proposal_count, created_at, profiles:client_id(display_name, handle)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left">
            <th className="p-3">案件</th>
            <th className="p-3">発注者</th>
            <th className="p-3">状態</th>
            <th className="p-3">応募</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {jobs?.map((j: any) => (
            <tr key={j.id} className="border-t border-slate-200">
              <td className="p-3">
                <Link href={`/jobs/${j.id}`} className="font-semibold hover:text-moai-primary">{j.title}</Link>
                <div className="text-xs text-slate-500">{j.category}</div>
              </td>
              <td className="p-3">{j.profiles?.display_name}</td>
              <td className="p-3"><span className="badge">{j.status}</span></td>
              <td className="p-3">{j.proposal_count}</td>
              <td className="p-3">
                {j.status !== "canceled" && j.status !== "completed" && (
                  <form action={cancelJob}>
                    <input type="hidden" name="id" value={j.id} />
                    <button className="btn-outline">停止</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
