import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ToastForm } from "@/components/ToastForm";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { MoaiBadge } from "@/components/MoaiBadge";
import type { ActionResult } from "@/lib/actions";
import type { CrowdRole } from "@/types/database";

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

const VALID_CROWD_ROLES: CrowdRole[] = [
  "general", "student", "alumni", "lecturer", "community_manager", "client",
];

async function updateMoaiRole(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  "use server";
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const crowd_role = String(formData.get("crowd_role") || "general") as CrowdRole;
  if (!VALID_CROWD_ROLES.includes(crowd_role)) {
    return { error: "無効なロールです" };
  }
  const cohortRaw = String(formData.get("cohort") || "").trim();
  const cohort = cohortRaw ? Number(cohortRaw) : null;
  if (cohortRaw && (!Number.isInteger(cohort) || (cohort as number) < 0)) {
    return { error: "期番号は0以上の整数で入力してください" };
  }
  const enrollment_date = String(formData.get("enrollment_date") || "") || null;
  const graduation_date = String(formData.get("graduation_date") || "") || null;

  const { error } = await admin.from("profiles").update({
    crowd_role,
    cohort,
    enrollment_date,
    graduation_date,
  }).eq("id", id);
  if (error) return { error: `更新失敗: ${error.message}` };

  await admin.from("audit_logs").insert({
    actor_id: user.id, action: "user.moai_role_update",
    target_kind: "profile", target_id: id,
    detail: { crowd_role, cohort, enrollment_date, graduation_date },
  });
  revalidatePath("/admin/users");
  return { success: `MOAIロールを「${crowd_role}」に更新しました` };
}

type SearchParams = {
  q?: string;
  role?: string;
  crowd_role?: string;
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
  const crowdRoleFilter = sp.crowd_role ?? "";
  const status = sp.status ?? "";
  const sortKey = sp.sort && SORTS[sp.sort] ? sp.sort : "newest";
  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select(
      "id, handle, display_name, avatar_url, role, crowd_role, cohort, enrollment_date, graduation_date, moai_badge_display, is_suspended, rating_avg, rating_count, created_at",
      { count: "exact" }
    );
  if (q) query = query.or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`);
  if (role) query = query.eq("role", role);
  if (crowdRoleFilter) query = query.eq("crowd_role", crowdRoleFilter);
  if (status === "suspended") query = query.eq("is_suspended", true);
  if (status === "active") query = query.eq("is_suspended", false);
  const sort = SORTS[sortKey];
  query = query.order(sort.col, { ascending: sort.asc }).range(from, to);

  const { data: users, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-3">
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
          <label htmlFor="crowd_role" className="label">MOAIロール</label>
          <select id="crowd_role" name="crowd_role" defaultValue={crowdRoleFilter} className="input">
            <option value="">すべて</option>
            <option value="student">🌱 在校生</option>
            <option value="alumni">🎓 卒業生</option>
            <option value="general">一般</option>
            <option value="lecturer">🏛 講師</option>
            <option value="community_manager">🛡 CM</option>
            <option value="client">client</option>
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
        {(q || role || crowdRoleFilter || status || sortKey !== "newest") && (
          <Link href="/admin/users" className="btn-ghost">クリア</Link>
        )}
      </form>

      <div className="text-xs text-moai-muted px-1">
        {total.toLocaleString()} 件中 {total === 0 ? 0 : from + 1}〜{Math.min(to + 1, total)} 件
      </div>

      {users && users.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th scope="col" className="p-3">ユーザー</th>
                <th scope="col" className="p-3">ロール</th>
                <th scope="col" className="p-3">評価</th>
                <th scope="col" className="p-3">状態</th>
                <th scope="col" className="p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-t border-slate-200 align-top">
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
                  <td className="p-3 space-y-1">
                    <span className="badge">{u.role}</span>
                    <div>
                      <MoaiBadge crowdRole={u.crowd_role} display cohort={u.cohort} />
                    </div>
                  </td>
                  <td className="p-3">★ {Number(u.rating_avg).toFixed(1)} <span className="text-xs text-moai-muted">({u.rating_count})</span></td>
                  <td className="p-3">
                    {u.is_suspended
                      ? <span className="badge-coral">停止中</span>
                      : <span className="badge-success">有効</span>}
                  </td>
                  <td className="p-3 space-y-2">
                    <ToastForm action={toggleSuspend} className="flex gap-2 items-center">
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="suspend" value={u.is_suspended ? "false" : "true"} />
                      {!u.is_suspended && (
                        <input name="reason" className="input text-xs" placeholder="停止理由" aria-label="停止理由" />
                      )}
                      <button className={u.is_suspended ? "btn-outline btn-sm" : "btn-danger btn-sm"}>
                        {u.is_suspended ? "解除" : "停止"}
                      </button>
                    </ToastForm>
                    <details className="group">
                      <summary className="btn-outline btn-sm cursor-pointer">MOAIロール設定</summary>
                      <ToastForm action={updateMoaiRole} className="mt-2 space-y-2 p-3 bg-slate-50 rounded-md border border-slate-200 w-80">
                        <input type="hidden" name="id" value={u.id} />
                        <div>
                          <label className="label text-[11px]">MOAIロール</label>
                          <select
                            name="crowd_role"
                            defaultValue={u.crowd_role ?? "general"}
                            className="input text-xs"
                          >
                            <option value="general">一般</option>
                            <option value="student">🌱 在校生</option>
                            <option value="alumni">🎓 卒業生</option>
                            <option value="lecturer">🏛 講師</option>
                            <option value="community_manager">🛡 コミュニティマネージャー</option>
                            <option value="client">client</option>
                          </select>
                        </div>
                        <div>
                          <label className="label text-[11px]">期</label>
                          <input
                            name="cohort"
                            type="number"
                            min={0}
                            defaultValue={u.cohort ?? ""}
                            className="input text-xs"
                            placeholder="1, 2, 3..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="label text-[11px]">入学日</label>
                            <input
                              name="enrollment_date"
                              type="date"
                              defaultValue={u.enrollment_date ?? ""}
                              className="input text-xs"
                            />
                          </div>
                          <div>
                            <label className="label text-[11px]">卒業日</label>
                            <input
                              name="graduation_date"
                              type="date"
                              defaultValue={u.graduation_date ?? ""}
                              className="input text-xs"
                            />
                          </div>
                        </div>
                        <button className="btn-primary btn-sm w-full">保存</button>
                      </ToastForm>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="🔍" title="該当するユーザーはいません" description="フィルタ条件を変えてください" />
      )}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          q={q}
          role={role}
          crowdRole={crowdRoleFilter}
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
  crowdRole,
  status,
  sort,
}: {
  page: number;
  totalPages: number;
  q: string;
  role: string;
  crowdRole: string;
  status: string;
  sort: string;
}) {
  const params = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (role) sp.set("role", role);
    if (crowdRole) sp.set("crowd_role", crowdRole);
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
