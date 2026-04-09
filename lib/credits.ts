// AIクレジット操作ヘルパー
import { createClient } from "@/lib/supabase/server";

export interface ConsumeResult {
  ok: boolean;
  consumed?: number;
  balance?: number;
  free?: boolean;
  error?: string;
  required?: number;
}

/**
 * AI機能のクレジット消費
 * ベータ期間中は is_free_during_beta=true で消費ゼロ
 */
export async function consumeCredits(
  userId: string,
  featureSlug: string,
  metadata: Record<string, any> = {}
): Promise<ConsumeResult> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("consume_credits", {
    p_user_id: userId,
    p_feature_slug: featureSlug,
    p_metadata: metadata,
  });
  if (error) return { ok: false, error: error.message };
  return data as ConsumeResult;
}

/**
 * 残高取得
 */
export async function getCreditsBalance(userId: string): Promise<number> {
  const sb = await createClient();
  const { data } = await sb.from("profiles").select("credits_balance").eq("id", userId).single();
  return data?.credits_balance ?? 0;
}

/**
 * AI機能一覧取得
 */
export async function getAiFeatures() {
  const sb = await createClient();
  const { data } = await sb.from("ai_features").select("*").eq("is_active", true).order("sort_order");
  return data ?? [];
}

/**
 * 購入パッケージ一覧
 */
export async function getCreditPackages() {
  const sb = await createClient();
  const { data } = await sb.from("credit_packages").select("*").eq("is_active", true).order("sort_order");
  return data ?? [];
}
