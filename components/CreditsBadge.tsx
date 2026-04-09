"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CreditsBadge({ userId }: { userId: string }) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.from("profiles").select("credits_balance").eq("id", userId).single()
      .then(({ data }) => setBalance(data?.credits_balance ?? 0));

    const ch = sb.channel(`credits:${userId}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload: { new: { credits_balance?: number } }) => setBalance(payload.new.credits_balance ?? 0))
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [userId]);

  if (balance === null) return null;
  return (
    <Link href="/credits" className="inline-flex items-center gap-1 text-xs font-semibold text-moai-accent-600 bg-moai-accent/10 rounded-full px-3 py-1.5 hover:bg-moai-accent/20 transition">
      <span>🪙</span>
      <span>{balance.toLocaleString()}</span>
    </Link>
  );
}
