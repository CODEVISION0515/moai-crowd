import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ToastForm } from "@/components/ToastForm";
import { EmptyState } from "@/components/EmptyState";
import { formatDateJP } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

async function cancelJob(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  "use server";
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const { error } = await admin.from("jobs").update({ status: "canceled" }).eq("id", id);
  if (error) return { error: "案件の停止に失敗しました" };
  await admin.from("audit_logs").insert({
    actor_id: user.id, action: "job.cancel", target_kind: "job", target_id: id,
  });
  revalidatePath("/admin/jobs");
  return { success: "案件を停止しました" };
}

type SearchParams = {
  q?: string;
  status?: string;
  category?: string;
  page?: string;
};

export default async function AdminJobsPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "";
  const category = sp.category ?? "";
  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();
  const [{ data: cats }] = await Promise.all([
    admin.from("categories").select("slug, label").order("sort_order"),
  ]);

  let query = admin
    .from("jobs")
    .select(
      "id, title, category, status, proposal_count, created_at, profiles:client_id(display_name, handle)",
      { count: "exact" }
    );
  if (q) query = query.ilike("title", `%${q}%`);
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data: jobs, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <form method="get" className="card flex gap-2 flex-wrap items-end">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="q" className="label">タイトル検索</label>
          <input id="q" name="q" defaultValue={q} className="input" placeholder="例: LP制作" />
        </div>
        <div>
          <label htmlFor="category" className="label">カテゴリ</label>
          <select id="category" name="category" defaultValue={category} className="input">
            <option value="">すべて</option>
            {cats?.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="label">状態</label>
          <select id="status" name="status" defaultValue={status} className="input">
            <option value="">すべて</option>
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
            <option value="canceled">canceled</option>
          </select>
        </div>
        <button className="btn-primary">絞り込む</button>
        {(q || status || category) && (
          <Link href="/admin/jobs" className="btn-ghost">クリア</Link>
        )}
      </form>

      <div className="text-xs text-moai-muted px-1">
        {total.toLocaleString()} 件中 {total === 0 ? 0 : from + 1}〜{Math.min(to + 1, total)} 件
      </div>

      {jobs && jobs.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th scope="col" className="p-3">案件</th>
                <th scope="col" className="p-3">発注者</th>
                <th scope="col" className="p-3">状態</th>
                <th scope="col" className="p-3">応募</th>
                <th scope="col" className="p-3">投稿日</th>
                <th scope="col" className="p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j: any) => (
                <tr key={j.id} className="border-t border-slate-200">
                  <td className="p-3">
                    <Link href={`/jobs/${j.id}`} className="font-semibold hover:text-moai-primary">{j.title}</Link>
                    <div className="text-xs text-slate-500">{j.category}</div>
                  </td>
                  <td className="p-3">
                    {j.profiles?.handle ? (
                      <Link href={`/profile/${j.profiles.handle}`} className="hover:text-moai-primary">
                        {j.profiles.display_name}
                      </Link>
                    ) : "-"}
                  </td>
                  <td className="p-3"><span className="badge">{j.status}</span></td>
                  <td className="p-3">{j.proposal_count}</td>
                  <td className="p-3 text-xs text-moai-muted">{formatDateJP(j.created_at)}</td>
                  <td className="p-3">
                    {j.status !== "canceled" && j.status !== "completed" && (
                      <ToastForm action={cancelJob}>
                        <input type="hidden" name="id" value={j.id} />
                        <button className="btn-outline btn-sm">停止</button>
                      </ToastForm>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="🔍" title="該当する案件はありません" description="フィルタ条件を変えてください" />
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} q={q} status={status} category={category} />
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  q,
  status,
  category,
}: {
  page: number;
  totalPages: number;
  q: string;
  status: string;
  category: string;
}) {
  const params = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (category) sp.set("category", category);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `?${s}` : "";
  };
  return (
    <nav aria-label="ページネーション" className="flex items-center justify-center gap-2 pt-3">
      {page > 1 ? (
        <Link href={`/admin/jobs${params(page - 1)}`} className="btn-outline btn-sm">← 前へ</Link>
      ) : (
        <span className="btn-outline btn-sm opacity-40 pointer-events-none">← 前へ</span>
      )}
      <span className="text-xs text-moai-muted">{page} / {totalPages}</span>
      {page < totalPages ? (
        <Link href={`/admin/jobs${params(page + 1)}`} className="btn-outline btn-sm">次へ →</Link>
      ) : (
        <span className="btn-outline btn-sm opacity-40 pointer-events-none">次へ →</span>
      )}
    </nav>
  );
}
