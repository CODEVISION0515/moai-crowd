import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EarningsPage({
  searchParams,
}: { searchParams: Promise<{ year?: string }> }) {
  const { year: yearParam } = await searchParams;
  const year = Number(yearParam) || new Date().getFullYear();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const from = `${year}-01-01`;
  const to = `${year + 1}-01-01`;

  const { data: contracts } = await sb
    .from("contracts")
    .select("id, amount_jpy, platform_fee_jpy, worker_payout_jpy, withholding_tax_jpy, net_payout_jpy, released_at, jobs(title)")
    .eq("worker_id", user.id)
    .eq("status", "released")
    .gte("released_at", from)
    .lt("released_at", to)
    .order("released_at", { ascending: true });

  const sum = (key: string) => contracts?.reduce((s, c: any) => s + (c[key] ?? 0), 0) ?? 0;
  const gross = sum("amount_jpy");
  const fee = sum("platform_fee_jpy");
  const payout = sum("worker_payout_jpy");
  const withheld = sum("withholding_tax_jpy");
  const net = sum("net_payout_jpy");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">💴 収益レポート</h1>
      <p className="text-sm text-slate-600 mb-6">確定申告の参考情報として使えます</p>

      <form className="card mb-6 flex items-center gap-2">
        <label className="label mb-0">対象年度</label>
        <select name="year" defaultValue={year} className="input max-w-xs">
          {[year, year - 1, year - 2].map((y) => <option key={y} value={y}>{y}年</option>)}
        </select>
        <button className="btn-outline">表示</button>
      </form>

      <div className="grid md:grid-cols-5 gap-3 mb-8">
        <Stat label="総売上" value={gross} />
        <Stat label="プラットフォーム手数料" value={fee} negative />
        <Stat label="総報酬" value={payout} />
        <Stat label="源泉徴収額" value={withheld} negative />
        <Stat label="実受取額" value={net} highlight />
      </div>

      <h2 className="text-lg font-semibold mb-3">内訳</h2>
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="p-3">完了日</th>
              <th className="p-3">案件</th>
              <th className="p-3 text-right">報酬</th>
              <th className="p-3 text-right">源泉徴収</th>
              <th className="p-3 text-right">実受取</th>
            </tr>
          </thead>
          <tbody>
            {contracts?.map((c: any) => (
              <tr key={c.id} className="border-t border-slate-200">
                <td className="p-3 text-xs">{c.released_at?.slice(0, 10)}</td>
                <td className="p-3">{c.jobs?.title}</td>
                <td className="p-3 text-right">{formatCurrency(c.worker_payout_jpy)}</td>
                <td className="p-3 text-right text-red-600">- {formatCurrency(c.withholding_tax_jpy ?? 0)}</td>
                <td className="p-3 text-right font-semibold">{formatCurrency(c.net_payout_jpy ?? c.worker_payout_jpy)}</td>
              </tr>
            ))}
            {(!contracts || contracts.length === 0) && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-500">この年度の完了案件はありません</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card mt-6 bg-amber-50 border-amber-200 text-sm">
        <div className="font-semibold mb-2">📋 確定申告の参考</div>
        <ul className="space-y-1 text-slate-700">
          <li>• 個人事業主の方は、総報酬 {formatCurrency(payout)} を事業所得として計上</li>
          <li>• 源泉徴収額 {formatCurrency(withheld)} は前払税額として確定申告で精算</li>
          <li>• プラットフォーム手数料 {formatCurrency(fee)} は経費として計上可能</li>
          <li>• 正確な申告は税理士・会計士にご相談ください</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, negative, highlight }: { label: string; value: number; negative?: boolean; highlight?: boolean }) {
  return (
    <div className={`card ${highlight ? "bg-moai-primary text-white" : ""}`}>
      <div className={`text-xs ${highlight ? "text-white/80" : "text-slate-500"}`}>{label}</div>
      <div className={`mt-2 text-lg font-bold ${negative ? "text-red-500" : ""}`}>
        {negative ? "- " : ""}{formatCurrency(value)}
      </div>
    </div>
  );
}
