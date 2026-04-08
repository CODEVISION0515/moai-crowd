"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LikeButton({
  targetKind, targetId, initialCount, initiallyLiked,
}: { targetKind: "post" | "comment"; targetId: string; initialCount: number; initiallyLiked: boolean }) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initiallyLiked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setBusy(false); return; }
    if (liked) {
      await sb.from("likes").delete()
        .eq("user_id", user.id).eq("target_kind", targetKind).eq("target_id", targetId);
      setCount((c) => c - 1);
    } else {
      await sb.from("likes").insert({ user_id: user.id, target_kind: targetKind, target_id: targetId });
      setCount((c) => c + 1);
    }
    setLiked(!liked);
    setBusy(false);
  }

  return (
    <button onClick={toggle} className={`text-sm ${liked ? "text-red-500" : "text-slate-500 hover:text-red-500"}`}>
      {liked ? "❤️" : "🤍"} {count}
    </button>
  );
}
