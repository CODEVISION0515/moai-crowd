import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

// 未設定でもbuildが通るよう遅延生成
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY未設定");
  if (!_stripe) _stripe = new Stripe(secretKey, { apiVersion: "2024-11-20.acacia" });
  return _stripe;
}

// 後方互換: Proxyで遅延評価
export const stripe = new Proxy({} as Stripe, {
  get(_t, prop) {
    const s = getStripe() as any;
    const v = s[prop];
    return typeof v === "function" ? v.bind(s) : v;
  },
});

export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || 10);
export const isStripeConfigured = !!secretKey;
