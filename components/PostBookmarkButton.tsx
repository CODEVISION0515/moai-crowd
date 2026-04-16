"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PostBookmarkButton({
  postId,
  isBookmarked,
}: {
  postId: string;
  isBookmarked: boolean;
}) {
  const [saved, setSaved] = useState(isBookmarked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setBusy(false); return; }

    if (saved) {
      await sb.from("post_bookmarks").delete()
        .eq("user_id", user.id).eq("post_id", postId);
    } else {
      await sb.from("post_bookmarks").insert({ user_id: user.id, post_id: postId });
    }
    setSaved(!saved);
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`text-sm transition-colors ${saved ? "text-moai-primary" : "text-moai-muted hover:text-moai-primary"}`}
      title={saved ? "保存済み" : "保存する"}
    >
      {saved ? (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.766.424L12 18.03l-7.234 4.536A.5.5 0 014 22.143V3a1 1 0 011-1z" /></svg>
      ) : (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
      )}
    </button>
  );
}
