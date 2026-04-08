"use client";
import { useState } from "react";

export default function LineLink({ linked }: { linked: boolean }) {
  const [token, setToken] = useState<string | null>(null);
  const [lineUrl, setLineUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/line/link-token", { method: "POST" });
    const data = await res.json();
    setToken(data.token);
    setLineUrl(data.lineUrl);
    setLoading(false);
  }

  return (
    <div className="card bg-green-50 border-green-200">
      <h3 className="font-semibold">LINE通知連携</h3>
      {linked ? (
        <p className="mt-2 text-sm text-green-700">✓ LINE連携済み。新着案件や応募通知をLINEで受け取れます。</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-600">
            公式LINEアカウントを友だち追加して連携コードを送信すると、重要な通知をLINEで受け取れます。
          </p>
          {!token ? (
            <button onClick={generate} disabled={loading} className="btn-primary mt-3">
              {loading ? "..." : "連携コードを発行"}
            </button>
          ) : (
            <div className="mt-3 space-y-2">
              <div className="rounded-md bg-white border border-slate-200 p-3">
                <div className="text-xs text-slate-500">連携コード (10分間有効)</div>
                <div className="mt-1 font-mono text-xl font-bold tracking-wider">{token}</div>
              </div>
              <a href={lineUrl!} target="_blank" className="btn-primary w-full">
                LINEで友だち追加してコードを送信
              </a>
              <p className="text-xs text-slate-500">
                友だち追加後、上記コードをトークで送信すると連携が完了します。
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
