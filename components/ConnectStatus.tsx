"use client";
import { useEffect, useState } from "react";

export default function ConnectStatus() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/connect/status").then((r) => r.json()).then(setStatus);
  }, []);

  async function onboard() {
    setLoading(true);
    const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(false);
  }

  if (!status) return <p className="text-sm text-slate-500">読み込み中...</p>;

  return (
    <div className="card bg-moai-paper">
      <h3 className="font-semibold">受注者口座 (Stripe Connect)</h3>
      {status.connected && status.payouts_enabled ? (
        <p className="mt-2 text-sm text-green-700">✓ 報酬を受け取れる状態です</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-600">
            案件を受注して報酬を受け取るには、Stripeで本人確認が必要です。
          </p>
          <button onClick={onboard} disabled={loading} className="btn-primary mt-3">
            {loading ? "..." : status.connected ? "オンボーディングを続ける" : "受注者登録を始める"}
          </button>
        </>
      )}
    </div>
  );
}
