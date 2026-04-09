import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAiFeatures, getCreditPackages, getCreditsBalance } from "@/lib/credits";

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
          {packages.map((p: any) => (
            <div key={p.id} className={`card relative ${p.is_popular ? "border-moai-accent ring-2 ring-moai-accent/30" : ""}`}>
              {p.is_popular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-moai-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">人気</div>
              )}
              <div className="font-semibold">{p.name}</div>
              <div className="mt-2 text-2xl font-bold text-moai-primary">
                {p.credits > 0 ? `${p.credits.toLocaleString()}pt` : "無制限"}
              </div>
              <div className="text-sm text-slate-500">¥{p.price_jpy.toLocaleString()}{p.id === "unlimited_monthly" ? "/月" : ""}</div>
              {p.description && <div className="mt-2 text-xs text-slate-500">{p.description}</div>}
              <button disabled className="mt-3 w-full btn-outline opacity-60 cursor-not-allowed">
                準備中
              </button>
            </div>
          ))}
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
              {features.map((f: any) => (
                <tr key={f.slug} className="border-t border-slate-100">
                  <td className="p-3">
                    <div className="font-medium">{f.name}</div>
                    {f.description && <div className="text-xs text-slate-500 mt-0.5">{f.description}</div>}
                  </td>
                  <td className="p-3 text-right text-slate-500">{f.credits_cost}pt</td>
                  <td className="p-3 text-right">
                    <span className="badge-success">無料</span>
                  </td>
                </tr>
              ))}
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
                {txs.map((t: any) => (
                  <tr key={t.id} className="border-t border-slate-100">
                    <td className="p-3 text-xs text-slate-500">
                      {new Date(t.created_at).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-3">{t.reason ?? t.kind}</td>
                    <td className={`p-3 text-right font-semibold ${t.amount > 0 ? "text-green-600" : "text-slate-600"}`}>
                      {t.amount > 0 ? "+" : ""}{t.amount}
                    </td>
                    <td className="p-3 text-right text-slate-500">{t.balance_after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-6 text-center text-slate-500">履歴はまだありません</p>
          )}
        </div>
      </section>
    </div>
  );
}
