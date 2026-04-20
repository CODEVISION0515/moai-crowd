import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAiFeatures, getCreditPackages, getCreditsBalance } from "@/lib/credits";
import CreditPurchaseButton from "@/components/CreditPurchaseButton";
import { EmptyState } from "@/components/EmptyState";
import { formatDateShort } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const [balance, packages, features, { data: txs }] = await Promise.all([
    getCreditsBalance(user.id),
    getCreditPackages(),
    getAiFeatures(),
    sb.from("credit_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
  ]);

  return (
    <div className="container-app py-6 md:py-10 space-y-8">
      {/* 残高カード */}
      <div className="card-flat bg-gradient-to-br from-moai-primary to-teal-700 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-white/80">AIクレジット残高</div>
            <div className="text-4xl font-black mt-1">{balance.toLocaleString()} <span className="text-lg font-normal">pt</span></div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/80 mb-2">🎁 ベータ期間中</div>
            <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs">
              <span>AI機能すべて無料</span>
            </div>
          </div>
        </div>
      </div>

      {/* ベータ告知 */}
      <div className="card border-moai-accent bg-moai-accent/5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <h3 className="font-semibold">ベータ期間の特別キャンペーン</h3>
            <p className="text-sm text-slate-600 mt-1">
              現在、すべてのAI機能を<strong>クレジット消費ゼロ</strong>でお使いいただけます。<br />
              クレジット購入機能は決済連携完了後にオープンします。
            </p>
          </div>
        </div>
      </div>

      {/* 購入パッケージ(スタブ) */}
      <section>
        <h2 className="section-title mb-4">クレジットパッケージ</h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
          {packages.map((p) => {
            const pkg = p as { id: string; name: string; credits: number; price_jpy: number; is_popular: boolean; description: string | null };
            return (
              <div key={pkg.id} className={`card relative ${pkg.is_popular ? "border-moai-accent ring-2 ring-moai-accent/30" : ""}`}>
                {pkg.is_popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-moai-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">人気</div>
                )}
                <div className="font-semibold">{pkg.name}</div>
                <div className="mt-2 text-2xl font-bold text-moai-primary">
                  {pkg.credits > 0 ? `${pkg.credits.toLocaleString()}pt` : "無制限"}
                </div>
                <div className="text-sm text-slate-500">¥{pkg.price_jpy.toLocaleString()}{pkg.id === "unlimited_monthly" ? "/月" : ""}</div>
                {pkg.description && <div className="mt-2 text-xs text-slate-500">{pkg.description}</div>}
                <CreditPurchaseButton packageId={pkg.id} label="購入する" />
              </div>
            );
          })}
        </div>
      </section>

      {/* AI機能一覧 */}
      <section>
        <h2 className="section-title mb-4">AI機能と消費クレジット</h2>
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="p-3">機能</th>
                <th className="p-3 text-right">通常</th>
                <th className="p-3 text-right">ベータ期間</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f) => {
                const feat = f as { slug: string; name: string; description: string | null; credits_cost: number };
                return (
                  <tr key={feat.slug} className="border-t border-slate-100">
                    <td className="p-3">
                      <div className="font-medium">{feat.name}</div>
                      {feat.description && <div className="text-xs text-slate-500 mt-0.5">{feat.description}</div>}
                    </td>
                    <td className="p-3 text-right text-slate-500">{feat.credits_cost}pt</td>
                    <td className="p-3 text-right">
                      <span className="badge-success">無料</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 履歴 */}
      <section>
        <h2 className="section-title mb-4">利用履歴</h2>
        <div className="card p-0 overflow-hidden">
          {txs && txs.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="p-3">日時</th>
                  <th className="p-3">内容</th>
                  <th className="p-3 text-right">変動</th>
                  <th className="p-3 text-right">残高</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => {
                  const tx = t as { id: string; created_at: string; reason: string | null; kind: string; amount: number; balance_after: number };
                  return (
                    <tr key={tx.id} className="border-t border-slate-100">
                      <td className="p-3 text-xs text-slate-500">
                        {formatDateShort(tx.created_at)}
                      </td>
                      <td className="p-3">{tx.reason ?? tx.kind}</td>
                      <td className={`p-3 text-right font-semibold ${tx.amount > 0 ? "text-green-600" : "text-slate-600"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </td>
                      <td className="p-3 text-right text-slate-500">{tx.balance_after}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState icon="🧾" title="履歴はまだありません" description="購入・利用の履歴はここに表示されます" />
          )}
        </div>
      </section>
    </div>
  );
}
