import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import InviteShare from "./InviteShare";

export const dynamic = "force-dynamic";

export default async function InvitePage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  // 紹介コード発行（既存があれば返す）
  const admin = createAdminClient();
  const { data: codeData } = await admin.rpc("issue_referral_code", { p_user_id: user.id });
  const code: string = codeData ?? "";

  // 自分の紹介実績
  const { data: referrals } = await sb
    .from("referrals")
    .select("referee_id, signup_rewarded_at, first_deal_rewarded_at, referee_segment, created_at")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false });

  const { data: rewardTxs } = await sb
    .from("credit_transactions")
    .select("amount")
    .eq("user_id", user.id)
    .in("kind", ["referral_signup", "referral_first_deal"]);

  const totalEarned = (rewardTxs ?? []).reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalReferred = referrals?.length ?? 0;
  const totalDealCompleted = (referrals ?? []).filter((r) => r.first_deal_rewarded_at).length;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://moai-crowd.vercel.app";
  const inviteUrl = `${baseUrl}/signup?ref=${code}`;

  return (
    <div className="container-app py-6 md:py-10 max-w-3xl space-y-8">
      {/* ヘッダー */}
      <div className="card-flat bg-gradient-to-br from-moai-accent to-amber-500 text-white">
        <div className="text-xs text-white/80">友達紹介プログラム</div>
        <div className="text-3xl font-black mt-1">紹介して、お互い得しよう 🎁</div>
        <p className="mt-2 text-sm text-white/90">
          あなたの紹介URLから登録 → クレジットが双方にプレゼント。<br />
          発注者を紹介すると <b>+2,000 クレジット</b>（約17,600円相当）の特典あり。
        </p>
      </div>

      {/* 紹介URL */}
      <div className="card space-y-3">
        <div className="text-sm font-semibold">あなたの紹介URL</div>
        <InviteShare url={inviteUrl} code={code} />
      </div>

      {/* 実績 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="text-xs text-slate-500">紹介人数</div>
          <div className="text-2xl font-bold mt-1">{totalReferred}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-slate-500">取引成立</div>
          <div className="text-2xl font-bold mt-1">{totalDealCompleted}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-slate-500">獲得クレジット</div>
          <div className="text-2xl font-bold mt-1">{totalEarned.toLocaleString()}</div>
        </div>
      </div>

      {/* 報酬ルール */}
      <div className="card space-y-3">
        <h2 className="font-semibold">報酬ルール</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="py-2">タイミング</th>
              <th className="py-2 text-right">あなた</th>
              <th className="py-2 text-right">相手</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2">URLから登録完了</td>
              <td className="py-2 text-right font-medium">+100</td>
              <td className="py-2 text-right">+500</td>
            </tr>
            <tr>
              <td className="py-2">相手の初回取引（受注者として）</td>
              <td className="py-2 text-right font-medium">+500</td>
              <td className="py-2 text-right">+200</td>
            </tr>
            <tr className="bg-moai-primary/5">
              <td className="py-2">相手の初回取引（<b>発注者として</b>）</td>
              <td className="py-2 text-right font-bold text-moai-primary">+2,000</td>
              <td className="py-2 text-right">+500</td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs text-slate-500">※ クレジットはAI機能・案件ブースト等のサイト内機能で利用できます。</p>
      </div>

      {/* 紹介履歴 */}
      {totalReferred > 0 && (
        <div className="card space-y-2">
          <h2 className="font-semibold">紹介履歴</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {(referrals ?? []).map((r) => (
              <li key={r.referee_id} className="py-2 flex items-center justify-between">
                <span className="text-slate-600">
                  {new Date(r.created_at).toLocaleDateString("ja-JP")} に登録
                </span>
                <span className="text-xs">
                  {r.first_deal_rewarded_at ? (
                    <span className="badge-success">
                      取引成立（{r.referee_segment === "client" ? "発注" : "受注"}）
                    </span>
                  ) : (
                    <span className="text-slate-400">登録のみ</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
