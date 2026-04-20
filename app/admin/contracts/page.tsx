import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency, formatDateJP } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SearchParams = {
  q?: string;
  status?: string;
  issue?: string;
  page?: string;
};

export default async function AdminContractsPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "";
  const issue = sp.issue ?? "";
  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();
  let query = admin
    .from("contracts")
    .select(
      "id, status, amount_jpy, worker_payout_jpy, platform_fee_jpy, funded_at, released_at, refunded_at, transfer_failed_at, transfer_failure_reason, created_at, jobs!inner(title), client:client_id(display_name, handle), worker:worker_id(display_name, handle)",
      { count: "exact" }
    );

  if (q) query = query.ilike("jobs.title", `%${q}%`);
  if (status) query = query.eq("status", status);
  if (issue === "transfer_failed") query = query.not("transfer_failed_at", "is", null);
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data: contracts, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-3">
      <form method="get" className="card flex gap-2 flex-wrap items-end">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="q" className="label">案件タイトル検索</label>
          <input id="q" name="q" defaultValue={q} className="input" placeholder="例: LP制作" />
        </div>
        <div>
          <label htmlFor="status" className="label">状態</label>
          <select id="status" name="status" defaultValue={status} className="input">
            <option value="">すべて</option>
            <option value="funded">funded (入金済)</option>
            <option value="working">working (作業中)</option>
            <option value="submitted">submitted (提出済)</option>
            <option value="released">released (支払済)</option>
            <option value="disputed">disputed (紛争中)</option>
            <option value="refunded">refunded (返金済)</option>
          </select>
        </div>
        <div>
          <label htmlFor="issue" className="label">問題フラグ</label>
          <select id="issue" name="issue" defaultValue={issue} className="input">
            <option value="">すべて</option>
            <option value="transfer_failed">Transfer失敗</option>
          </select>
        </div>
        <button className="btn-primary">絞り込む</button>
        {(q || status || issue) && (
          <Link href="/admin/contracts" className="btn-ghost">クリア</Link>
        )}
      </form>

      <div className="text-xs text-moai-muted px-1">
        {total.toLocaleString()} 件中 {total === 0 ? 0 : from + 1}〜{Math.min(to + 1, total)} 件
      </div>

      {contracts && contracts.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th scope="col" className="p-3">案件</th>
                <th scope="col" className="p-3">当事者</th>
                <th scope="col" className="p-3">状態</th>
                <th scope="col" className="p-3 text-right">金額</th>
                <th scope="col" className="p-3">作成日</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c: any) => (
                <tr key={c.id} className="border-t border-slate-200">
                  <td className="p-3">
                    <Link href={`/admin/contracts/${c.id}`} className="font-semibold hover:text-moai-primary">
                      {c.jobs?.title ?? "(案件なし)"}
                    </Link>
                    {c.transfer_failed_at && (
                      <div className="mt-1">
                        <span className="badge-coral text-[10px]">Transfer失敗</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-xs">
                    <div>発注: {c.client?.display_name ?? "-"}</div>
                    <div>受注: {c.worker?.display_name ?? "-"}</div>
                  </td>
                  <td className="p-3"><span className="badge">{c.status}</span></td>
                  <td className="p-3 text-right font-semibold whitespace-nowrap">{formatCurrency(c.amount_jpy)}</td>
                  <td className="p-3 text-xs text-moai-muted whitespace-nowrap">{formatDateJP(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="📄" title="該当する契約はありません" />
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} q={q} status={status} issue={issue} />
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  q,
  status,
  issue,
}: {
  page: number;
  totalPages: number;
  q: string;
  status: string;
  issue: string;
}) {
  const params = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (issue) sp.set("issue", issue);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `?${s}` : "";
  };
  return (
    <nav aria-label="ページネーション" className="flex items-center justify-center gap-2 pt-3">
      {page > 1 ? (
        <Link href={`/admin/contracts${params(page - 1)}`} className="btn-outline btn-sm">← 前へ</Link>
      ) : (
        <span className="btn-outline btn-sm opacity-40 pointer-events-none">← 前へ</span>
      )}
      <span className="text-xs text-moai-muted">{page} / {totalPages}</span>
      {page < totalPages ? (
        <Link href={`/admin/contracts${params(page + 1)}`} className="btn-outline btn-sm">次へ →</Link>
      ) : (
        <span className="btn-outline btn-sm opacity-40 pointer-events-none">次へ →</span>
      )}
    </nav>
  );
}
