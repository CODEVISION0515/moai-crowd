"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = `${base}/auth/reset-password`;

    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);

    // プライバシー配慮: 存在しないメールでも同じ画面を出す
    if (error) console.warn("[reset] error:", error.message);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-var(--header-h))] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-moai-primary/10 mb-4"
              aria-hidden="true"
            >
              <svg className="h-8 w-8 text-moai-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">メールを送信しました</h1>
            <p className="mt-2 text-sm text-moai-muted">
              {email && <><strong className="text-moai-ink">{email}</strong><br /></>}
              にパスワードリセット用のリンクを送信しました。
            </p>
          </div>
          <div className="card space-y-4">
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 h-5 w-5 rounded-full bg-moai-primary/10 text-moai-primary flex items-center justify-center text-[11px] font-bold">1</span>
                <span>メールアプリを開く</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 h-5 w-5 rounded-full bg-moai-primary/10 text-moai-primary flex items-center justify-center text-[11px] font-bold">2</span>
                <span>「MOAI Crowd」からのメールを開く</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 h-5 w-5 rounded-full bg-moai-primary/10 text-moai-primary flex items-center justify-center text-[11px] font-bold">3</span>
                <span>「パスワードを再設定」リンクをクリック</span>
              </li>
            </ol>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              <strong>📮 メールが届かない場合：</strong>
              <ul className="mt-1.5 space-y-0.5 ml-4 list-disc">
                <li>迷惑メールフォルダを確認</li>
                <li>入力したメールアドレスが登録時と同じか確認</li>
                <li>数分待ってから再送信を試す</li>
              </ul>
            </div>
            <button
              onClick={() => {
                toast.success("再送信するには、もう一度メールアドレスを入力してください");
                setSent(false);
              }}
              className="btn-outline w-full"
            >
              もう一度送信
            </button>
          </div>
          <p className="text-sm text-center text-moai-muted mt-6">
            <Link href="/login" className="text-moai-primary font-medium hover:underline">
              ← ログイン画面に戻る
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-var(--header-h))] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold text-moai-primary">MOAI</span>
            <span className="text-sm text-moai-muted">Crowd</span>
          </div>
          <h1 className="text-2xl font-bold">パスワードをリセット</h1>
          <p className="text-sm text-moai-muted mt-1">
            登録したメールアドレスを入力してください。<br />
            再設定用のリンクをお送りします。
          </p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <label htmlFor="email" className="label">メールアドレス</label>
            <input
              id="email"
              type="email"
              required
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-accent w-full btn-lg">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                送信中…
              </span>
            ) : (
              "リセットリンクを送信"
            )}
          </button>

          <p className="text-sm text-center text-moai-muted pt-2">
            <Link href="/login" className="text-moai-primary font-medium hover:underline">
              ← ログインに戻る
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
