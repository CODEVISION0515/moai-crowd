import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { formatDateJP, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

const KIND_OPTIONS: { value: string; label: string }[] = [
  { value: "escrow_fund", label: "入金 (エスクロー)" },
  { value: "escrow_release", label: "支払い (受注者)" },
  { value: "platform_fee", label: "プラットフォーム手数料" },
  { value: "refund", label: "返金" },
  { value: "credit_purchase", label: "クレジット購入" },
  { value: "credit_usage", label: "クレジット消費" },
];

type SearchParams = {
  kind?: string;
  from?: string;
  to?: string;
  page?: string;
};

export default async function AdminTransactionsPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const kind = sp.kind ?? "";
  const fromDate = sp.from ?? "";
  const toDate = sp.to ?? "";
  const page = Math.max(1, Number(sp.page) || 1);
  const offsetFrom = (page - 1) * PAGE_SIZE;
  const offsetTo = offsetFrom + PAGE_SIZE - 1;

  const admin = createAdminClient();
  let query = admin
    .from("transactions")
    .select("*, contracts(jobs(title))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offsetFrom, offsetTo);
  if (kind) query = query.eq("kind", kind);
  if (fromDate) query = query.gte("created_at", `${fromDate}T00:00:00Z`);
  if (toDate) query = query.lte("created_at", `${toDate}T23:59:59Z`);

  const { data: txs, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const sum = txs?.reduce((s: number, t: any) => s + (t.amount_jpy ?? 0), 0) ?? 0;

  return (
    <div className="space-y-3">
      <form method="get" className="card flex gap-2 flex-wrap items-end">
        <div>
          <label htmlFor="kind" className="label">種別</label>
          <select id="kind" name="kind" defaultValue={kind} className="input">
            <option value="">すべて</option>
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="from" className="label">開始日</label>
          <input id="from" name="from" type="date" defaultValue={fromDate} className="input" />
        </div>
        <div>
          <label htmlFor="to" className="label">終了日</label>
          <input id="to" name="to" type="date" defaultValue={toDate} className="input" />
        </div>
        <button className="btn-primary">絞り込む</button>
        {(kind || fromDate || toDate) && (
          <Link href="/admin/transactions" className="btn-ghost">クリア</Link>
        )}
      </form>

      <div className="flex items-center justify-between text-xs text-moai-muted px-1">
        <span>
          {total.toLocaleString()} 件中 {total === 0 ? 0 : offsetFrom + 1}〜{Math.min(offsetTo + 1, total)} 件
        </span>
        {txs && txs.length > 0 && (
          <span className="font-semibold text-moai-ink">
            このページ合計: {formatCurrency(sum)}
          </span>
        )}
      </div>

      {txs && txs.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th scope="col" className="p-3">日時</th>
                <th scope="col" className="p-3">案件</th>
                <th scope="col" className="p-3">種別</th>
                <th scope="col" className="p-3 text-right">金額</th>
                <th scope="col" className="p-3">備考</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t: any) => (
                <tr key={t.id} className="border-t border-slate-200">
                  <td className="p-3 text-xs text-slate-500 whitespace-nowrap">
                    {formatDateJP(t.created_at)}
                  </td>
                  <td className="p-3">{t.contracts?.jobs?.title ?? "-"}</td>
                  <td className="p-3"><span className="badge">{t.kind}</span></td>
                  <td className="p-3 text-right font-semibold whitespace-nowrap">{formatCurrency(t.amount_jpy)}</td>
                  <td className="p-3 text-xs text-slate-500">{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="💸" title="該当する取引はありません" description="条件を変えてください" />
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} kind={kind} fromDate={fromDate} toDate={toDate} />
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  kind,
  fromDate,
  toDate,
}: {
  page: number;
  totalPages: number;
  kind: string;
  fromDate: string;
  toDate: string;
}) {
  const params = (p: number) => {
    const sp = new URLSearchParams();
    if (kind) sp.set("kind", kind);
    if (fromDate) sp.set("from", fromDate);
    if (toDate) sp.set("to", toDate);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `?${s}` : "";
  };
  return (
    <nav aria-label="ページネーション" className="flex items-center justify-center gap-2 pt-3">
      {page > 1 ? (
        <Link href={`/admin/transactions${params(page - 1)}`} className="btn-outline btn-sm">← 前へ</Link>
      ) : (
        <span className="btn-outline btn-sm opacity-40 pointer-events-none">← 前へ</span>
      )}
      <span className="text-xs text-moai-muted">{page} / {totalPages}</span>
      {page < totalPages ? (
        <Link href={`/admin/transactions${params(page + 1)}`} className="btn-outline btn-sm">次へ →</Link>
      ) : (
        <span className="btn-outline btn-sm opacity-40 pointer-events-none">次へ →</span>
      )}
    </nav>
  );
}
