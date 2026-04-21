"use client";
import { useEffect, useState } from "react";
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

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";
  const intent = searchParams.get("intent") ?? "";
  const intentCopy = INTENT_COPY[intent];
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
    if (!agreedToTerms) {
      setErr("利用規約とプライバシーポリシーに同意してください");
      return;
    }
    setLoading(true); setErr(null);
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const callback = new URL("/auth/callback", base);
    callback.searchParams.set("new", "1");
    if (intent) callback.searchParams.set("next", `/onboarding?intent=${intent}`);
    else callback.searchParams.set("next", "/onboarding");

    const { data, error } = await createClient().auth.signUp({
      email, password,
      options: {
        emailRedirectTo: callback.toString(),
        data: {
          display_name: displayName,
          ...(refCode ? { referral_code: refCode } : {}),
          ...(intent ? { signup_intent: intent } : {}),
        },
      },
    });
    setLoading(false);
    if (error) return setErr(error.message);

    // Supabase の挙動:
    // - メール認証ONの場合: data.user あり but session なし → 確認メール待ちページへ
    // - メール認証OFFの場合: data.session あり → オンボへ直行
    if (data.user && !data.session) {
      router.push(`/signup/confirm?email=${encodeURIComponent(email)}`);
    } else {
      const next = intent ? `/onboarding?intent=${intent}` : "/onboarding";
      router.push(next);
    }
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-var(--header-h))] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold text-moai-primary">MOAI</span>
            <span className="text-sm text-moai-muted">Crowd</span>
          </div>
          <h1 className="text-2xl font-bold">新規登録</h1>
          <p className="text-sm text-moai-muted mt-1">30秒で完了。完全無料。</p>
        </div>

        {/* Intent banner */}
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
                <div className="text-sm font-medium">@{referrer.handle}（{referrer.display_name}）からの紹介</div>
                <div className="text-xs text-moai-muted mt-0.5">登録完了で <span className="font-semibold text-moai-primary">+500クレジット</span> 獲得</div>
              </div>
            </div>
          </div>
        )}

        <div className="card space-y-4">
          <SocialAuthButtons isSignUp redirectTo="/onboarding" />

          <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">表示名</label>
            <input
              required
              className="input"
              placeholder="あなたの名前"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <label className="label">メールアドレス</label>
            <input
              type="email"
              required
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">パスワード</label>
            <input
              type="password"
              required
              minLength={8}
              className="input"
              placeholder="8文字以上"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {password.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${pwStrength >= level ? pwColor : "bg-slate-100"}`} />
                  ))}
                </div>
                <span className="text-[11px] text-moai-muted">{pwLabel}</span>
              </div>
            )}
          </div>

          <label className="flex items-start gap-2 text-xs text-moai-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-moai-primary focus:ring-moai-primary"
              aria-describedby="terms-desc"
            />
            <span id="terms-desc">
              <Link href="/legal/terms" target="_blank" className="text-moai-primary hover:underline">利用規約</Link>
              {" と "}
              <Link href="/legal/privacy" target="_blank" className="text-moai-primary hover:underline">プライバシーポリシー</Link>
              {" に同意します"}
            </span>
          </label>

          {err && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2" role="alert">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {err}
            </div>
          )}

          <button type="submit" disabled={loading || !agreedToTerms} className="btn-accent w-full btn-lg">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                作成中...
              </span>
            ) : "アカウント作成"}
          </button>

          <p className="text-sm text-center text-moai-muted pt-2">
            既にアカウントをお持ち？{" "}
            <Link href="/login" className="text-moai-primary font-medium hover:underline">ログイン</Link>
          </p>
          </form>
        </div>

        {/* Social proof */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-moai-muted">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-moai-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            エスクロー決済で安心
          </span>
          <span className="text-moai-border">|</span>
          <span>手数料10%</span>
          <span className="text-moai-border">|</span>
          <span>AI機能無料</span>
        </div>
      </div>
    </div>
  );
}
