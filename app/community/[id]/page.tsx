import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import CommentForm from "./CommentForm";
import LikeButton from "./LikeButton";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  const { data: post } = await sb
    .from("posts")
    .select("*, author:author_id(id, handle, display_name, level, rating_avg)")
    .eq("id", id).single();
  if (!post) notFound();

  // view_count増加 (非同期, ベストエフォート)
  sb.from("posts").update({ view_count: (post.view_count ?? 0) + 1 }).eq("id", id);

  const { data: comments } = await sb
    .from("post_comments")
    .select("*, author:author_id(handle, display_name, level)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const { data: likedRow } = user
    ? await sb.from("likes").select("user_id").eq("user_id", user.id).eq("target_kind", "post").eq("target_id", id).maybeSingle()
    : { data: null };

  async function acceptAnswer(formData: FormData) {
    "use server";
    const commentId = String(formData.get("comment_id"));
    const sb2 = await createClient();
    const { data: { user: u } } = await sb2.auth.getUser();
    if (!u || u.id !== post.author_id) return;
    await sb2.from("posts").update({ is_solved: true, accepted_comment_id: commentId }).eq("id", id);
    revalidatePath(`/community/${id}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/community" className="text-sm text-moai-primary hover:underline">← コミュニティに戻る</Link>

      <article className="card mt-4">
        <div className="flex items-center justify-between">
          <span className="badge">{post.kind}</span>
          {post.kind === "question" && post.is_solved && (
            <span className="badge bg-green-100 text-green-700">✓ 解決済み</span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold">{post.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
          <Link href={`/profile/${post.author?.handle}`} className="hover:text-moai-primary">
            {post.author?.display_name} <span className="text-xs">Lv.{post.author?.level ?? 1}</span>
          </Link>
          <span className="text-xs text-slate-400">{new Date(post.created_at).toLocaleString("ja-JP")}</span>
        </div>
        <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</div>
        {post.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((t: string) => <span key={t} className="badge">#{t}</span>)}
          </div>
        )}
        <div className="mt-4 flex items-center gap-3 text-sm text-slate-500 border-t border-slate-100 pt-3">
          <LikeButton targetKind="post" targetId={post.id} initialCount={post.like_count} initiallyLiked={!!likedRow} />
          <span>💬 {post.comment_count}</span>
          <span>👁 {post.view_count}</span>
        </div>
      </article>

      <h2 className="mt-8 text-lg font-semibold">コメント ({comments?.length ?? 0})</h2>
      <div className="mt-3 space-y-3">
        {comments?.map((c: any) => (
          <div key={c.id} className={`card ${post.accepted_comment_id === c.id ? "border-green-500 bg-green-50" : ""}`}>
            {post.accepted_comment_id === c.id && (
              <div className="text-xs text-green-700 font-semibold mb-2">✓ ベストアンサー</div>
            )}
            <div className="flex items-center justify-between">
              <Link href={`/profile/${c.author?.handle}`} className="text-sm font-semibold hover:text-moai-primary">
                {c.author?.display_name} <span className="text-xs text-slate-500">Lv.{c.author?.level ?? 1}</span>
              </Link>
              <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString("ja-JP")}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{c.body}</p>
            <div className="mt-2 flex items-center gap-3">
              <LikeButton targetKind="comment" targetId={c.id} initialCount={c.like_count} initiallyLiked={false} />
              {post.kind === "question" && !post.is_solved && user?.id === post.author_id && (
                <form action={acceptAnswer}>
                  <input type="hidden" name="comment_id" value={c.id} />
                  <button className="text-xs text-green-700 hover:underline">ベストアンサーにする</button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>

      {user ? (
        <div className="mt-6">
          <CommentForm postId={post.id} />
        </div>
      ) : (
        <p className="mt-6 text-sm text-center text-slate-500">
          コメントするには <Link href="/login" className="text-moai-primary hover:underline">ログイン</Link> してください
        </p>
      )}
    </div>
  );
}
