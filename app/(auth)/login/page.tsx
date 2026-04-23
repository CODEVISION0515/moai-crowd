"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient, setSessionPersistence } from "@/lib/supabase/client";
import SocialAuthButtons from "@/components/SocialAuthButtons";

const TEASER_CARDS = [
  {
    title: "AIを学ぶスクール",
    subtitle: "先生はいない、仲間がいる",
    icon: "🎓",
    href: "/school",
    gradient: "from-moai-primary/10 to-moai-primary/5",
  },
  {
    title: "案件を依頼する",
    subtitle: "発注者手数料0〜4%",
    icon: "💼",
    href: "/jobs/new",
    gradient: "from-amber-100 to-amber-50",
  },
  {
    title: "案件を探す",
    subtitle: "卒業生は生涯5%固定",
    icon: "🔍",
    href: "/jobs",
    gradient: "from-emerald-100 to-emerald-50",
  },
  {
    title: "ゆんたくコミュニティ",
    subtitle: "沖縄発・誰でも参加OK",
    icon: "🌱",
    href: "/community",
    gradient: "from-cyan-100 to-cyan-50",
  },
  {
    title: "MOAIメンバー",
    subtitle: "仲間のプロフィールを見る",
    icon: "👥",
    href: "/workers",
    gradient: "from-purple-100 to-purple-50",
  },
  {
    title: "紹介で500クレジット",
    subtitle: "招待コードでお得に",
    icon: "🎁",
    href: "/invite",
    gradient: "from-rose-100 to-rose-50",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";
  const urlError = params.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [err, setErr] = useState<string | null>(urlError);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setSessionPersistence(rememberMe);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErr(error.message);
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-var(--header-h))] bg-moai-cloud/30 py-10 md:py-14">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_1.1fr] gap-8 lg:gap-10 items-start">
          {/* Left: Login form */}
          <div className="w-full max-w-md mx-auto lg:max-w-none animate-slide-up">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">ログイン</h1>
            <p className="text-sm text-moai-muted mb-6">
              アカウント未作成の方は{" "}
              <Link href="/signup" className="text-moai-primary hover:underline font-medium">
                新規会員登録はこちら
              </Link>
            </p>

            <div className="card space-y-5 shadow-sm">
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="label">メールアドレス</label>
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder="例: info@moai.okinawa"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="label">パスワード</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="input pr-10"
                      placeholder="8文字以上"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-moai-muted hover:text-moai-ink transition-colors"
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
                </div>

                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-moai-primary focus:ring-moai-primary"
                  />
                  <span className="text-moai-ink">次回から自動的にログイン</span>
                </label>

                {err && (
                  <div
                    className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
                    role="alert"
                  >
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
                      ログイン中...
                    </span>
                  ) : (
                    "ログイン"
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-moai-primary hover:underline"
                  >
                    パスワードを忘れた方はこちら
                  </Link>
                </div>
              </form>

              <div className="relative flex items-center py-1">
                <div className="flex-1 border-t border-moai-border" />
                <span className="px-3 text-xs text-moai-muted">または</span>
                <div className="flex-1 border-t border-moai-border" />
              </div>

              <SocialAuthButtons redirectTo={redirect} />
            </div>
          </div>

          {/* Right: Service teaser cards */}
          <aside className="hidden lg:block">
            <div className="text-xs font-semibold text-moai-muted uppercase tracking-wider mb-3">
              MOAIで できること
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TEASER_CARDS.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className={`group relative overflow-hidden rounded-xl border border-moai-border bg-gradient-to-br ${c.gradient} p-4 hover:shadow-soft transition-all hover:-translate-y-0.5`}
                >
                  <div className="text-2xl mb-2" aria-hidden="true">{c.icon}</div>
                  <h3 className="font-bold text-sm text-moai-ink leading-tight">{c.title}</h3>
                  <p className="text-[11px] text-moai-muted mt-1 leading-snug">{c.subtitle}</p>
                  <span className="absolute top-3 right-3 text-moai-muted group-hover:text-moai-primary group-hover:translate-x-0.5 transition-all" aria-hidden="true">
                    →
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-6 text-[11px] text-moai-muted leading-relaxed">
              MOAIは沖縄発のAIプラットフォーム。スクールで学び、
              コミュニティでゆんたく、Crowdで仕事。
              <Link href="/how-it-works" className="text-moai-primary hover:underline ml-1">
                使い方を見る →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
