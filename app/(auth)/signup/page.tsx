"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const { error } = await createClient().auth.signUp({
      email, password,
      options: { data: { display_name: displayName } },
    });
    setLoading(false);
    if (error) return setErr(error.message);
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold mb-2 text-center">新規登録</h1>
      <p className="text-center text-sm text-slate-600 mb-6">コミュニティ参加は完全無料です</p>
      <form onSubmit={onSubmit} className="card space-y-4">
        <div>
          <label className="label">表示名</label>
          <input required className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <label className="label">メールアドレス</label>
          <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">パスワード (8文字以上)</label>
          <input type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "..." : "アカウント作成"}
        </button>
        <p className="text-sm text-center text-slate-600">
          既にアカウントをお持ち？ <Link href="/login" className="text-moai-primary hover:underline">ログイン</Link>
        </p>
      </form>
    </div>
  );
}
