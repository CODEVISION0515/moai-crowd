"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!body.trim()) return;
    setLoading(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from("post_comments").insert({ post_id: postId, author_id: user.id, body });
    await sb.rpc("award_xp", { p_user_id: user.id, p_reason: "comment_created", p_amount: 5, p_meta: null });
    setBody("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="card">
      <textarea rows={4} className="input" value={body} onChange={(e) => setBody(e.target.value)}
        placeholder="コメントを書く..." />
      <button onClick={submit} disabled={loading || !body.trim()} className="btn-primary mt-2">
        {loading ? "送信中..." : "コメントする"}
      </button>
    </div>
  );
}
