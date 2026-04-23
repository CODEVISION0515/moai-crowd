"use client";
import { useState } from "react";
import { toast } from "sonner";

export default function ConnectStartButton({ isPending }: { isPending: boolean }) {
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
      const { url, error } = await res.json();
      if (error) {
        toast.error(`エラー: ${error}`);
        setLoading(false);
        return;
      }
      if (url) {
        window.location.href = url;
      }
    } catch (e) {
      toast.error("開始に失敗しました。時間をおいて再度お試しください。");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={start}
        disabled={loading}
        className="btn-accent btn-lg w-full"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Stripeへ移動中…
          </span>
        ) : isPending ? (
          "続きから入力する →"
        ) : (
          "Stripeで登録を始める →"
        )}
      </button>
      <p className="text-[11px] text-moai-muted text-center">
        🔒 Stripeは世界最大級の決済プラットフォーム。情報は暗号化されて安全に保管されます。
      </p>
    </div>
  );
}
