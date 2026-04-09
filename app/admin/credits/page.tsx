import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { formatDateJP } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function grantCredits(formData: FormData) {
  "use server";
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const handle = String(formData.get("handle") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const reason = String(formData.get("reason") || "管理者付与");

  if (!handle || !amount) return;

  const { data: target } = await admin.from("profiles").select("id").eq("handle", handle).single();
  if (!target) throw new Error("ユーザーが見つかりません");

  await admin.rpc("grant_credits", {
    p_user_id: target.id,
    p_amount: amount,
    p_kind: "admin_grant",
    p_reason: reason,
    p_metadata: { granted_by: user.id },
    p_stripe_pi: null,
  });
  await admin.from("audit_logs").insert({
    actor_id: user.id, action: "credits.grant",
    target_kind: "profile", target_id: target.id,
    detail: { amount, reason },
  });
  revalidatePath("/admin/credits");
}

export default async function AdminCreditsPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: topUsers }, { data: recentTxs }, stats] = await Promise.all([
    admin.from("profiles")
      .select("id, handle, display_name, credits_balance")
      .order("credits_balance", { ascending: false })
      .limit(20),
    admin.from("credit_transactions")
      .select("*, profiles:user_id(handle, display_name)")
      .order("created_at", { ascending: false })
      .limit(30),
    Promise.all([
      admin.from("credit_transactions").select("amount", { count: "exact", head: false }).eq("kind", "consume"),
      admin.from("credit_transactions").select("amount").eq("kind", "purchase"),
      admin.from("profiles").select("credits_balance"),
    ]).then(([consumed, purchased, profiles]) => ({
      totalConsumed: (consumed.data as any)?.reduce((s: number, r: any) => s + Math.abs(r.amount ?? 0), 0) ?? 0,
      totalPurchased: (purchased.data as any)?.reduce((s: number, r: any) => s + (r.amount ?? 0), 0) ?? 0,
      totalBalance: (profiles.data as any)?.reduce((s: number, r: any) => s + (r.credits_balance ?? 0), 0) ?? 0,
    })),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">クレジット管理</h2>

      <div className="grid md:grid-cols-3 gap-3">
        <Stat label="流通中の残高" value={`${stats.totalBalance.toLocaleString()} pt`} />
        <Stat label="累計消費" value={`${stats.totalConsumed.toLocaleString()} pt`} />
        <Stat label="累計購入" value={`${stats.totalPurchased.toLocaleString()} pt`} />
      </div>

      {/* 手動付与フォーム */}
      <form action={grantCredits} className="card space-y-3">
        <h3 className="font-semibold">手動クレジット付与</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">ハンドル</label>
            <input name="handle" required className="input" placeholder="user_xxx" />
          </div>
          <div>
            <label className="label">付与量</label>
            <input name="amount" type="number" required className="input" placeholder="1000" />
          </div>
          <div>
            <label className="label">理由</label>
            <input name="reason" className="input" placeholder="キャンペーン特典等" />
          </div>
        </div>
        <button className="btn-primary">付与する</button>
      </form>

      {/* 残高ランキング */}
      <div>
        <h3 className="font-semibold mb-3">残高ランキング</h3>
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="p-3">ユーザー</th>
                <th className="p-3 text-right">残高</th>
              </tr>
            </thead>
            <tbody>
              {topUsers?.map((u: any) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="p-3">{u.display_name} <span className="text-xs text-slate-500">@{u.handle}</span></td>
                  <td className="p-3 text-right font-semibold">{(u.credits_balance ?? 0).toLocaleString()} pt</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 取引履歴 */}
      <div>
        <h3 className="font-semibold mb-3">直近の取引</h3>
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="p-3">日時</th>
                <th className="p-3">ユーザー</th>
                <th className="p-3">種別</th>
                <th className="p-3">理由</th>
                <th className="p-3 text-right">増減</th>
              </tr>
            </thead>
            <tbody>
              {recentTxs?.map((t: any) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="p-3 text-xs text-slate-500">{formatDateJP(t.created_at)}</td>
                  <td className="p-3">{t.profiles?.display_name}</td>
                  <td className="p-3"><span className="badge">{t.kind}</span></td>
                  <td className="p-3 text-xs">{t.reason}</td>
                  <td className={`p-3 text-right font-semibold ${t.amount > 0 ? "text-green-600" : "text-slate-500"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}
