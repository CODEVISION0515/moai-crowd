"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SocialAuthButtons from "@/components/SocialAuthButtons";

type Referrer = { handle: string; display_name: string };

const INTENT_COPY: Record<string, { tagline: string; bullets: string[] }> = {
  client: {
    tagline: "🚀 仕事を頼みたい方向け",
    bullets: [
      "ローンチ6ヶ月 手数料0%",
      "AI・Web・デザイン・動画など幅広く対応",
      "MOAI卒業生が品質担保",
    ],
  },
  worker: {
    tagline: "🎯 仕事を受けたい方向け",
    bullets: [
      "業界最安級 5〜15% 手数料",
      "卒業生は生涯 5% 固定",
      "初受注はメンター監修で安心",
    ],
  },
};

// Next.js 15 では useSearchParams() は Suspense 配下でないと prerender エラーになる。
// 内側の Inner に切り出して Suspense でラップする。
export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-var(--header-h))] flex items-center justify-center text-sm text-moai-muted">読み込み中…</div>}>
      <SignUpPageInner />
    </Suspense>
  );
}

function SignUpPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";
  const intent = searchParams.get("intent") ?? "";
  const intentCopy = INTENT_COPY[intent];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [referrer, setReferrer] = useState<Referrer | null>(null);

  useEffect(() => {
    if (!refCode) return;
    fetch(`/api/referral/lookup?code=${encodeURIComponent(refCode)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setReferrer(data))
      .catch(() => {});
  }, [refCode]);

  const pwStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const pwColor = ["bg-slate-200", "bg-red-400", "bg-amber-400", "bg-emerald-500"][pwStrength];
  const pwLabel = ["", "弱い", "普通", "強い"][pwStrength];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const callback = new URL("/auth/callback", base);
    callback.searchParams.set("new", "1");
    if (intent) callback.searchParams.set("next", `/onboarding?intent=${intent}`);
    else callback.searchParams.set("next", "/onboarding");

    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callback.toString(),
        data: {
          ...(refCode ? { referral_code: refCode } : {}),
          ...(intent ? { signup_intent: intent } : {}),
        },
      },
    });
    setLoading(false);
    if (error) return setErr(error.message);

    if (data.user && !data.session) {
      router.push(`/signup/confirm?email=${encodeURIComponent(email)}`);
    } else {
      const next = intent ? `/onboarding?intent=${intent}` : "/onboarding";
      router.push(next);
    }
    router.refresh();
  }

  // 逆インテントへの誘導 (ランサーズの「仕事を発注したい方はこちら」相当)
  const flipIntent =
    intent === "client"
      ? { label: "仕事を受注したい方はこちら", href: "/signup?intent=worker" }
      : { label: "仕事を発注したい方はこちら", href: "/signup?intent=client" };

  return (
    <div className="min-h-[calc(100vh-var(--header-h))] bg-moai-cloud/30 py-10 md:py-14">
      <div className="mx-auto w-full max-w-md px-4 animate-slide-up">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">新規会員登録</h1>

        {/* Intent banner (cf. ?intent=client|worker) */}
        {intentCopy && (
          <div className="card mb-4 border-moai-primary/30 bg-moai-primary/[0.03]">
            <div className="text-sm font-semibold text-moai-primary mb-1.5">{intentCopy.tagline}</div>
            <ul className="text-xs text-moai-muted space-y-0.5">
              {intentCopy.bullets.map((b) => (
                <li key={b} className="flex items-start gap-1.5">
                  <span className="text-moai-primary mt-0.5" aria-hidden="true">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Referrer banner */}
        {referrer && (
          <div className="card mb-4 border-moai-primary/30 bg-moai-primary/[0.03] animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-moai-primary/10 flex items-center justify-center text-lg">🎁</div>
              <div>
                <div className="text-sm font-medium">
                  @{referrer.handle}（{referrer.display_name}）からの紹介
                </div>
                <div className="text-xs text-moai-muted mt-0.5">
                  登録完了で <span className="font-semibold text-moai-primary">+500クレジット</span> 獲得
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card space-y-5">
          <p className="text-xs text-moai-muted text-center leading-relaxed">
            <Link href="/legal/privacy" target="_blank" className="text-moai-primary hover:underline">
              プライバシーポリシー
            </Link>
            {" · "}
            <Link href="/legal/terms" target="_blank" className="text-moai-primary hover:underline">
              利用規約
            </Link>
            {" に同意して"}
          </p>

          <div>
            <div className="text-sm font-semibold mb-3">メールアドレスで登録する</div>
            <form onSubmit={onSubmit} className="space-y-3">
              <input
                type="email"
                required
                className="input"
                placeholder="例: info@moai.okinawa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  className="input pr-10"
                  placeholder="パスワード (8文字以上)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-moai-muted hover:text-moai-ink"
                  aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${pwStrength >= level ? pwColor : "bg-slate-100"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-moai-muted">{pwLabel}</span>
                </div>
              )}

              {err && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2" role="alert">
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {err}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-accent w-full btn-lg">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    作成中...
                  </span>
                ) : (
                  "無料で会員登録する"
                )}
              </button>
            </form>
          </div>

          <div className="text-center">
            <Link href={flipIntent.href} className="text-sm text-moai-primary hover:underline">
              {flipIntent.label}
            </Link>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-1 border-t border-moai-border" />
            <span className="px-3 text-[11px] text-moai-muted">または同意して</span>
            <div className="flex-1 border-t border-moai-border" />
          </div>

          <SocialAuthButtons isSignUp redirectTo="/onboarding" />

          <p className="text-[11px] text-moai-muted text-center">
            ※ MOAIが許可なくSNS等に投稿することはありません
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-moai-primary hover:underline">
            すでに登録済みの方はこちら
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-8 flex items-center justify-center gap-3 text-[11px] text-moai-muted flex-wrap">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-moai-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            エスクロー決済で安心
          </span>
          <span className="text-moai-border">|</span>
          <span>手数料0〜15%</span>
          <span className="text-moai-border">|</span>
          <span>AI機能無料</span>
        </div>
      </div>
    </div>
  );
}
