import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function toggleSuspend(formData: FormData) {
  "use server";
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const suspend = formData.get("suspend") === "true";
  const reason = String(formData.get("reason") || "");
  await admin.from("profiles").update({
    is_suspended: suspend,
    suspended_reason: suspend ? reason : null,
  }).eq("id", id);
  await admin.from("audit_logs").insert({
    actor_id: user.id, action: suspend ? "user.suspend" : "user.unsuspend",
    target_kind: "profile", target_id: id, detail: { reason },
  });
  revalidatePath("/admin/users");
}

export default async function AdminUsersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const admin = createAdminClient();
  let query = admin.from("profiles")
    .select("id, handle, display_name, role, is_suspended, rating_avg, rating_count, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) query = query.or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`);
  const { data: users } = await query;

  return (
    <div className="space-y-3">
      <form className="card flex gap-2">
        <input name="q" defaultValue={q} className="input" placeholder="ハンドル or 表示名で検索" />
        <button className="btn-outline">検索</button>
      </form>
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="p-3">ユーザー</th>
              <th className="p-3">役割</th>
              <th className="p-3">評価</th>
              <th className="p-3">状態</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-t border-slate-200">
                <td className="p-3">
                  <div className="font-semibold">{u.display_name}</div>
                  <div className="text-xs text-slate-500">@{u.handle}</div>
                </td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">★ {Number(u.rating_avg).toFixed(1)} ({u.rating_count})</td>
                <td className="p-3">
                  {u.is_suspended ? <span className="text-red-600">停止中</span> : "有効"}
                </td>
                <td className="p-3">
                  <form action={toggleSuspend} className="flex gap-2 items-center">
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="suspend" value={u.is_suspended ? "false" : "true"} />
                    {!u.is_suspended && (
                      <input name="reason" className="input text-xs" placeholder="理由" />
                    )}
                    <button className={u.is_suspended ? "btn-outline" : "btn-primary"}>
                      {u.is_suspended ? "解除" : "停止"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
