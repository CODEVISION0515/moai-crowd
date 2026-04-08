import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function updateReport(formData: FormData) {
  "use server";
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as "reviewing" | "resolved" | "dismissed";
  const note = String(formData.get("admin_note") || "");
  await admin.from("reports").update({
    status, admin_note: note,
    handled_by: user.id,
    handled_at: new Date().toISOString(),
  }).eq("id", id);
  await admin.from("audit_logs").insert({
    actor_id: user.id, action: "report." + status,
    target_kind: "report", target_id: id, detail: { note },
  });
  revalidatePath("/admin/reports");
}

export default async function ReportsPage() {
  const admin = createAdminClient();
  const { data: reports } = await admin
    .from("reports")
    .select("*, reporter:reporter_id(display_name, handle)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">通報一覧</h2>
      {reports?.map((r: any) => (
        <div key={r.id} className="card">
          <div className="flex justify-between items-start">
            <div>
              <span className="badge">{r.status}</span>
              <span className="ml-2 text-sm text-slate-500">{r.target_kind}</span>
              <div className="mt-1 font-semibold">{r.reason}</div>
              {r.detail && <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{r.detail}</p>}
              <div className="mt-2 text-xs text-slate-400">
                通報者: {r.reporter?.display_name} / {new Date(r.created_at).toLocaleString("ja-JP")}
              </div>
            </div>
          </div>
          {r.status === "open" || r.status === "reviewing" ? (
            <form action={updateReport} className="mt-3 flex gap-2 items-end">
              <input type="hidden" name="id" value={r.id} />
              <input name="admin_note" className="input flex-1" placeholder="対応メモ" />
              <select name="status" className="input max-w-xs" defaultValue="resolved">
                <option value="reviewing">確認中</option>
                <option value="resolved">対応済</option>
                <option value="dismissed">却下</option>
              </select>
              <button className="btn-primary">更新</button>
            </form>
          ) : (
            r.admin_note && <div className="mt-2 text-sm text-slate-600">メモ: {r.admin_note}</div>
          )}
        </div>
      ))}
      {(!reports || reports.length === 0) && <p className="text-slate-500 text-center py-10">通報はありません</p>}
    </div>
  );
}
