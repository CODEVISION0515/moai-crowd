import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ToastForm } from "@/components/ToastForm";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import type { ActionResult } from "@/lib/actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

async function toggleSuspend(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  "use server";
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const suspend = formData.get("suspend") === "true";
  const reason = String(formData.get("reason") || "");
  if (suspend && !reason.trim()) {
    return { error: "停止理由を入力してください" };
  }
  const { error } = await admin.from("profiles").update({
    is_suspended: suspend,
    suspended_reason: suspend ? reason : null,
  }).eq("id", id);
  if (error) return { error: "更新に失敗しました" };
  await admin.from("audit_logs").insert({
    actor_id: user.id, action: suspend ? "user.suspend" : "user.unsuspend",
    target_kind: "profile", target_id: id, detail: { reason },
  });
  revalidatePath("/admin/users");
  return { success: suspend ? "ユーザーを停止しました" : "停止を解除しました" };
}

type SearchParams = {
  q?: string;
  role?: string;
  status?: string;
  sort?: string;
  page?: string;
};

const SORTS: Record<string, { col: string; asc: boolean }> = {
  newest: { col: "created_at", asc: false },
  oldest: { col: "created_at", asc: true },
  rating_high: { col: "rating_avg", asc: false },
  rating_low: { col: "rating_avg", asc: true },
};

export default async function AdminUsersPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const role = sp.role ?? "";
  const status = sp.status ?? "";
  const sortKey = sp.sort && SORTS[sp.sort] ? sp.sort : "newest";
  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select("id, handle, display_name, avatar_url, role, is_suspended, rating_avg, rating_count, created_at", { count: "exact" });
  if (q) query = query.or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`);
  if (role) query = query.eq("role", role);
  if (status === "suspended") query = query.eq("is_suspended", true);
  if (status === "active") query = query.eq("is_suspended", false);
  const sort = SORTS[sortKey];
  query = query.order(sort.col, { ascending: sort.asc }).range(from, to);

  const { data: users, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <form method="get" className="card flex gap-2 flex-wrap items-end">
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="q" className="label">キーワード</label>
          <input id="q" name="q" defaultValue={q} className="input" placeholder="ハンドル or 表示名" />
        </div>
        <div>
          <label htmlFor="role" className="label">役割</label>
          <select id="role" name="role" defaultValue={role} className="input">
            <option value="">すべて</option>
            <option value="admin">admin</option>
            <option value="moderator">moderator</option>
            <option value="user">user</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="label">状態</label>
          <select id="status" name="status" defaultValue={status} className="input">
            <option value="">すべて</option>
            <option value="active">有効</option>
            <option value="suspended">停止中</option>
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="label">並び順</label>
          <select id="sort" name="sort" defaultValue={sortKey} className="input">
            <option value="newest">登録新しい順</option>
            <option value="oldest">登録古い順</option>
            <option value="rating_high">評価高い順</option>
            <option value="rating_low">評価低い順</option>
          </select>
        </div>
        <button className="btn-primary">絞り込む</button>
        {(q || role || status || sortKey !== "newest") && (
          <Link href="/admin/users" className="btn-ghost">クリア</Link>
        )}
      </form>

      <div className="text-xs text-moai-muted px-1">
        {total.toLocaleString()} 件中 {from + 1}〜{Math.min(to + 1, total)} 件
      </div>

      {users && users.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th scope="col" className="p-3">ユーザー</th>
                <th scope="col" className="p-3">役割</th>
                <th scope="col" className="p-3">評価</th>
                <th scope="col" className="p-3">状態</th>
                <th scope="col" className="p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-200">
                  <td className="p-3">
                    <Link href={`/profile/${u.handle}`} className="flex items-center gap-3 group">
                      <span className="h-8 w-8 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-xs font-semibold text-moai-muted shrink-0">
                        <Avatar src={u.avatar_url} name={u.display_name} size={32} />
                      </span>
                      <span>
                        <span className="font-semibold group-hover:text-moai-primary transition-colors block">{u.display_name}</span>
                        <span className="text-xs text-slate-500">@{u.handle}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="p-3"><span className="badge">{u.role}</span></td>
                  <td className="p-3">★ {Number(u.rating_avg).toFixed(1)} <span className="text-xs text-moai-muted">({u.rating_count})</span></td>
                  <td className="p-3">
                    {u.is_suspended
                      ? <span className="badge-coral">停止中</span>
                      : <span className="badge-success">有効</span>}
                  </td>
                  <td className="p-3">
                    <ToastForm action={toggleSuspend} className="flex gap-2 items-center">
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="suspend" value={u.is_suspended ? "false" : "true"} />
                      {!u.is_suspended && (
                        <input
                          name="reason"
                          className="input text-xs"
                          placeholder="理由"
                          aria-label="停止理由"
                        />
                      )}
                      <button className={u.is_suspended ? "btn-outline btn-sm" : "btn-danger btn-sm"}>
                        {u.is_suspended ? "解除" : "停止"}
                      </button>
                    </ToastForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="🔍" title="該当するユーザーはいません" description="フィルタ条件を変えてください" />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          q={q}
          role={role}
          status={status}
          sort={sortKey}
        />
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  q,
  role,
  status,
  sort,
}: {
  page: number;
  totalPages: number;
  q: string;
  role: string;
  status: string;
  sort: string;
}) {
  const params = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (role) sp.set("role", role);
    if (status) sp.set("status", status);
    if (sort !== "newest") sp.set("sort", sort);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `?${s}` : "";
  };
  return (
    <nav aria-label="ページネーション" className="flex items-center justify-center gap-2 pt-3">
      {page > 1 ? (
        <Link href={`/admin/users${params(page - 1)}`} className="btn-outline btn-sm">← 前へ</Link>
      ) : (
        <span className="btn-outline btn-sm opacity-40 pointer-events-none">← 前へ</span>
      )}
      <span className="text-xs text-moai-muted">{page} / {totalPages}</span>
      {page < totalPages ? (
        <Link href={`/admin/users${params(page + 1)}`} className="btn-outline btn-sm">次へ →</Link>
      ) : (
        <span className="btn-outline btn-sm opacity-40 pointer-events-none">次へ →</span>
      )}
    </nav>
  );
}
