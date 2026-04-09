"use client";

import { useState } from "react";

export default function CreditPurchaseButton({
  packageId,
  label,
  className = "",
}: {
  packageId: string;
  label: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handlePurchase() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "エラーが発生しました");
        setLoading(false);
      }
    } catch {
      alert("通信エラーが発生しました");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className={`btn-primary w-full ${className}`}
    >
      {loading ? "処理中..." : label}
    </button>
  );
}
