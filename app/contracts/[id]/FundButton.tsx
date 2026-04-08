"use client";
import { useState } from "react";

export default function FundButton({ contractId }: { contractId: string }) {
  const [loading, setLoading] = useState(false);
  async function onClick() {
    setLoading(true);
    const res = await fetch(`/api/contracts/${contractId}/fund`, { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(false);
  }
  return (
    <button onClick={onClick} disabled={loading} className="btn-primary mt-3 w-full">
      {loading ? "..." : "Stripeで入金する"}
    </button>
  );
}
