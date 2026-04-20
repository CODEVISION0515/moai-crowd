// 手数料計算ロジック
// fee_rules テーブルを参照し、当日有効な料率で計算する
import { createAdminClient } from "@/lib/supabase/server";

export type WorkerRole = "student" | "alumni" | "general";
export type ClientRole = "client";

export type FeeBreakdown = {
  amount: number; // 契約金額（受注者への税抜支払ベース）
  workerFeeRate: number; // 受注者側手数料率 (0〜1)
  clientFeeRate: number; // 発注者側手数料率 (0〜1)
  workerFee: number; // 受注者が負担する手数料（円）
  clientFee: number; // 発注者が負担する手数料（円）
  workerPayout: number; // 受注者受取額 = amount - workerFee
  clientCharge: number; // 発注者請求額 = amount + clientFee
  platformRevenue: number; // MOAI手数料合計 = workerFee + clientFee
  workerRoleUsed: WorkerRole;
  asOf: string; // ISO date
};

type Sb = ReturnType<typeof createAdminClient>;

/**
 * 指定日時点の料率を取得。
 * fee_rules に該当が無ければ fallback (worker=15%, client=0%)。
 */
export async function getFeeRate(
  sb: Sb,
  role: WorkerRole | ClientRole,
  asOf: Date = new Date(),
): Promise<number> {
  const iso = asOf.toISOString().slice(0, 10);
  const { data, error } = await sb.rpc("get_fee_rate", { p_role: role, p_at: iso });
  if (error || data == null) {
    // Fallback: 仕様書の標準値
    if (role === "student") return 0;
    if (role === "alumni") return 0.05;
    if (role === "general") return 0.15;
    if (role === "client") return asOf < new Date("2026-11-01") ? 0 : 0.04;
    return 0.15;
  }
  return Number(data);
}

/**
 * 受注者ロール × 金額 × 日付 から手数料内訳を計算。
 *
 * MOAIの料率モデル:
 * - 受注者: student=0% / alumni=5% / general=15%
 * - 発注者: ローンチ6ヶ月(2026/05-10)=0% / 2026/11-=4%
 */
export async function calculateFees(
  sb: Sb,
  amount: number,
  workerRole: WorkerRole,
  asOf: Date = new Date(),
): Promise<FeeBreakdown> {
  const [workerFeeRate, clientFeeRate] = await Promise.all([
    getFeeRate(sb, workerRole, asOf),
    getFeeRate(sb, "client", asOf),
  ]);

  const workerFee = Math.floor(amount * workerFeeRate);
  const clientFee = Math.floor(amount * clientFeeRate);
  const workerPayout = amount - workerFee;
  const clientCharge = amount + clientFee;
  const platformRevenue = workerFee + clientFee;

  return {
    amount,
    workerFeeRate,
    clientFeeRate,
    workerFee,
    clientFee,
    workerPayout,
    clientCharge,
    platformRevenue,
    workerRoleUsed: workerRole,
    asOf: asOf.toISOString(),
  };
}

/**
 * profiles.crowd_role から WorkerRole を導出。
 * lecturer/community_manager/client/admin は general 扱い（通常 Crowd 受注はしない想定）。
 */
export function resolveWorkerRole(crowdRole: string | null | undefined): WorkerRole {
  if (crowdRole === "student" || crowdRole === "alumni") return crowdRole;
  return "general";
}
