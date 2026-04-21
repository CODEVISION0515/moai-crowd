"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmEmailPage() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    if (!email || cooldown > 0) return;
    setResending(true);
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const callback = new URL("/auth/callback", base);
    callback.searchParams.set("new", "1");
    callback.searchParams.set("next", "/onboarding");
    const { error } = await createClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: callback.toString() },
    });
    setResending(false);
    if (error) {
      toast.error(`再送信に失敗: ${error.message}`);
      return;
    }
    toast.success("確認メールを再送信しました");
    setCooldown(60);
  }

  return (
    <div className="min-h-[calc(100vh-var(--header-h))] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-moai-primary/10 mb-4" aria-hidden="true">
            <svg className="h-8 w-8 text-moai-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">メールを確認してください</h1>
          <p className="mt-2 text-sm text-moai-muted">
            {email ? (
              <>
                <strong className="text-moai-ink">{email}</strong><br />
                宛に確認リンクを送信しました。
              </>
            ) : (
              "ご登録のメールアドレスに確認リンクを送信しました。"
            )}
          </p>
        </div>

        <div className="card space-y-5">
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
              <span>「アカウントを確認」リンクをクリック</span>
            </li>
          </ol>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            <strong>📮 メールが届かない場合：</strong>
            <ul className="mt-1.5 space-y-0.5 ml-4 list-disc">
              <li>迷惑メールフォルダを確認</li>
              <li>数分待ってから再送信を試す</li>
              <li>入力したメールアドレスが正しいか確認</li>
            </ul>
          </div>

          <button
            onClick={resend}
            disabled={cooldown > 0 || resending || !email}
            className="btn-outline w-full"
          >
            {resending
              ? "送信中…"
              : cooldown > 0
              ? `再送信まで ${cooldown} 秒`
              : "確認メールを再送信"}
          </button>
        </div>

        <p className="text-sm text-center text-moai-muted mt-6">
          メールアドレスを間違えた？{" "}
          <Link href="/signup" className="text-moai-primary font-medium hover:underline">
            登録をやり直す
          </Link>
        </p>
      </div>
    </div>
  );
}
