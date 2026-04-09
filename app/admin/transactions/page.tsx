import { createAdminClient } from "@/lib/supabase/server";
import { formatDateJP, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
  const admin = createAdminClient();
  const { data: txs } = await admin
    .from("transactions")
    .select("*, contracts(jobs(title))")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left">
            <th className="p-3">日時</th>
            <th className="p-3">案件</th>
            <th className="p-3">種別</th>
            <th className="p-3 text-right">金額</th>
            <th className="p-3">備考</th>
          </tr>
        </thead>
        <tbody>
          {txs?.map((t: any) => (
            <tr key={t.id} className="border-t border-slate-200">
              <td className="p-3 text-xs text-slate-500">
                {formatDateJP(t.created_at)}
              </td>
              <td className="p-3">{t.contracts?.jobs?.title ?? "-"}</td>
              <td className="p-3"><span className="badge">{t.kind}</span></td>
              <td className="p-3 text-right font-semibold">{formatCurrency(t.amount_jpy)}</td>
              <td className="p-3 text-xs text-slate-500">{t.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
