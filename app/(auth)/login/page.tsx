"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient, setSessionPersistence } from "@/lib/supabase/client";
import SocialAuthButtons from "@/components/SocialAuthButtons";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";
  const urlError = params.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [err, setErr] = useState<string | null>(urlError);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    // signIn前にセッション保持方式を決める (localStorage or sessionStorage)
    setSessionPersistence(rememberMe);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErr(error.message);
    router.push(redirect);
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
          <h1 className="text-2xl font-bold">おかえりなさい</h1>
          <p className="text-sm text-moai-muted mt-1">アカウントにログインしてください</p>
        </div>

        <div className="card space-y-4">
          <SocialAuthButtons redirectTo={redirect} />

          <form onSubmit={onSubmit} className="space-y-4">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="label !mb-0">パスワード</label>
              <Link href="/forgot-password" className="text-[11px] text-moai-primary hover:underline">
                パスワードを忘れた？
              </Link>
            </div>
            <input
              type="password"
              required
              className="input"
              placeholder="8文字以上"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-moai-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-moai-primary focus:ring-moai-primary"
            />
            <span>このブラウザにログイン保持（30日）</span>
          </label>

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
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ログイン中...
              </span>
            ) : "ログイン"}
          </button>

          <p className="text-sm text-center text-moai-muted pt-2">
            アカウント未作成？{" "}
            <Link href="/signup" className="text-moai-primary font-medium hover:underline">新規登録</Link>
          </p>
          </form>
        </div>
      </div>
    </div>
  );
}
