"use client";
import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function FundButton({
  contractId,
  amount,
  retryMode = false,
}: {
  contractId: string;
  amount: number;
  retryMode?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/fund`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        toast.error(json.error ?? "入金ページの起動に失敗しました");
        setLoading(false);
        return;
      }
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      toast.error("入金ページの URL が取得できませんでした");
      setLoading(false);
    } catch {
      toast.error("通信エラーです。時間をおいて再度お試しください");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-busy={loading}
        className={`${retryMode ? "btn-outline" : "btn-primary"} btn-lg w-full inline-flex items-center justify-center gap-2`}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Stripe へ移動中…
          </>
        ) : (
          <>
            {retryMode ? "🔄 もう一度入金する" : `💳 ${formatCurrency(amount)} を入金する`}
          </>
        )}
      </button>
      <p className="text-[11px] text-moai-muted text-center">
        🔒 安全な決済プラットフォーム Stripe へ移動します。決済情報は MOAI には保存されません。
      </p>
    </div>
  );
}
