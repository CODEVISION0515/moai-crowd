"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  // Supabase はクライアント側で hash から自動でセッションを確立する
  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => {
      setVerifying(false);
      if (!data.session) {
        setErr("リンクが無効または期限切れです。再度パスワードリセットを申請してください。");
      }
    });
  }, []);

  const pwStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const pwColor = ["bg-slate-200", "bg-red-400", "bg-amber-400", "bg-emerald-500"][pwStrength];
  const pwLabel = ["", "弱い", "普通", "強い"][pwStrength];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) {
      setErr("パスワードは8文字以上にしてください");
      return;
    }
    if (password !== confirm) {
      setErr("確認用パスワードが一致しません");
      return;
    }
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    toast.success("パスワードを更新しました");
    router.push("/dashboard");
    router.refresh();
  }

  if (verifying) {
    return (
      <div className="min-h-[calc(100vh-var(--header-h))] flex items-center justify-center px-4 py-12">
        <p className="text-sm text-moai-muted">確認中…</p>
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
          <h1 className="text-2xl font-bold">新しいパスワードを設定</h1>
          <p className="text-sm text-moai-muted mt-1">8文字以上の安全なパスワードを入力してください</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <label htmlFor="password" className="label">新しいパスワード</label>
            <input
              id="password"
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
          <div>
            <label htmlFor="confirm" className="label">確認用（もう一度）</label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              className="input"
              placeholder="同じパスワードを入力"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {err && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2" role="alert">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {err}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-accent w-full btn-lg">
            {loading ? "更新中…" : "パスワードを更新"}
          </button>

          <p className="text-sm text-center text-moai-muted pt-2">
            <Link href="/login" className="text-moai-primary font-medium hover:underline">
              ログイン画面に戻る
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
