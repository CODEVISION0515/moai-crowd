"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NotificationBell({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);
  const pathname = usePathname();
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sb = createClient();
    let cancelled = false;

    async function refetch() {
      const { count } = await sb
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null);
      if (!cancelled) setCount(count ?? 0);
    }

    // 初回取得
    refetch();

    /** デバウンス再取得（短時間に複数イベントが届くケース対応） */
    function scheduleRefetch() {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      refetchTimer.current = setTimeout(refetch, 300);
    }

    const ch = sb
      .channel(`notif:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => setCount((c) => c + 1),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => scheduleRefetch(),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => scheduleRefetch(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      sb.removeChannel(ch);
    };
  }, [userId]);

  // 通知ページ遷移後は再取得（既読化サーバーアクション後の同期）
  useEffect(() => {
    if (pathname === "/notifications") {
      const sb = createClient();
      sb.from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null)
        .then(({ count }) => setCount(count ?? 0));
    }
  }, [pathname, userId]);

  const label = count > 0 ? `通知 (未読 ${count}件)` : "通知";
  return (
    <Link
      href="/notifications"
      aria-label={label}
      className="relative inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-moai-cloud hover:text-moai-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moai-primary/30 transition-colors"
    >
      <BellIcon className="h-5 w-5" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none ring-2 ring-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
