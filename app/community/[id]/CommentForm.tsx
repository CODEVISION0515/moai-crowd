"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CommentForm({
  postId,
  parentId,
  replyTo,
  onDone,
}: {
  postId: string;
  parentId?: string;
  replyTo?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState(replyTo ? `@${replyTo} ` : "");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!body.trim()) return;
    setLoading(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }

    await sb.from("post_comments").insert({
      post_id: postId,
      author_id: user.id,
      body,
      parent_id: parentId ?? null,
    });
    await sb.rpc("award_xp", { p_user_id: user.id, p_reason: "comment_created", p_amount: 5, p_meta: null });
    setBody("");
    setLoading(false);
    onDone?.();
    router.refresh();
  }

  return (
    <div className={parentId ? "" : "card"}>
      <textarea
        rows={parentId ? 2 : 4}
        className="input"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentId ? "返信を書く..." : "コメントを書く... (Markdown対応)"}
      />
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={submit}
          disabled={loading || !body.trim()}
          className="btn-accent btn-sm"
        >
          {loading ? "送信中..." : parentId ? "返信する" : "コメントする"}
        </button>
        {parentId && onDone && (
          <button onClick={onDone} className="btn-ghost btn-sm">キャンセル</button>
        )}
      </div>
    </div>
  );
}
