"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NotificationBell({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);
  const sb = createClient();

  useEffect(() => {
    async function load() {
      const { count } = await sb
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null);
      setCount(count ?? 0);
    }
    load();

    const ch = sb.channel(`notif:${userId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => setCount((c) => c + 1))
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [userId]);

  return (
    <Link href="/notifications" className="relative hover:text-moai-primary">
      🔔
      {count > 0 && (
        <span className="absolute -top-2 -right-3 rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.5 min-w-[18px] text-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
