import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import MarkdownBody from "@/components/MarkdownBody";
import PostBookmarkButton from "@/components/PostBookmarkButton";
import { Avatar } from "@/components/Avatar";
import CommentForm from "./CommentForm";
import CommentThread from "./CommentThread";
import LikeButton from "./LikeButton";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  discussion: { label: "ディスカッション", icon: "💬", color: "badge bg-blue-50 text-blue-700" },
  question: { label: "質問", icon: "❓", color: "badge bg-amber-50 text-amber-700" },
  showcase: { label: "作品シェア", icon: "🎨", color: "badge bg-purple-50 text-purple-700" },
  announcement: { label: "お知らせ", icon: "📣", color: "badge bg-red-50 text-red-700" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  const { data: post } = await sb
    .from("posts")
    .select("*, author:author_id(id, handle, display_name, avatar_url, level, rating_avg)")
    .eq("id", id).single();
  if (!post) notFound();

  // view_count増加
  sb.from("posts").update({ view_count: (post.view_count ?? 0) + 1 }).eq("id", id);

  const [{ data: comments }, likedRes, bookmarkRes] = await Promise.all([
    sb.from("post_comments")
      .select("*, author:author_id(handle, display_name, level)")
      .eq("post_id", id)
      .order("created_at", { ascending: true }),
    user
      ? sb.from("likes").select("user_id").eq("user_id", user.id).eq("target_kind", "post").eq("target_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? sb.from("post_bookmarks").select("user_id").eq("user_id", user.id).eq("post_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Build thread tree
  const topLevel = comments?.filter((c: any) => !c.parent_id) ?? [];
  const repliesMap = new Map<string, any[]>();
  comments?.filter((c: any) => c.parent_id).forEach((c: any) => {
    const arr = repliesMap.get(c.parent_id) ?? [];
    arr.push(c);
    repliesMap.set(c.parent_id, arr);
  });

  const kindMeta = KIND_LABELS[post.kind] ?? KIND_LABELS.discussion;

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
    <div className="container-app max-w-3xl py-8 pb-nav">
      {/* Breadcrumb */}
      <Link href="/community" className="inline-flex items-center gap-1 text-sm text-moai-muted hover:text-moai-primary transition-colors mb-4">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        コミュニティ
      </Link>

      {/* Post */}
      <article className="card">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={kindMeta.color}>{kindMeta.icon} {kindMeta.label}</span>
            {post.kind === "question" && post.is_solved && (
              <span className="badge-success">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                解決済み
              </span>
            )}
          </div>
          {user && <PostBookmarkButton postId={post.id} isBookmarked={!!bookmarkRes.data} />}
        </div>

        {/* Title */}
        <h1 className="mt-3 text-xl font-bold leading-snug">{post.title}</h1>

        {/* Author */}
        <div className="mt-3 flex items-center gap-3">
          <Link href={`/profile/${post.author?.handle}`} className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-xs font-semibold text-moai-muted shrink-0">
              <Avatar src={post.author?.avatar_url} name={post.author?.display_name} size={32} />
            </div>
            <div>
              <div className="text-sm font-medium group-hover:text-moai-primary transition-colors">
                {post.author?.display_name}
                <span className="ml-1 text-xs text-moai-muted font-normal">Lv.{post.author?.level ?? 1}</span>
              </div>
              <div className="text-[11px] text-moai-muted">{timeAgo(post.created_at)}</div>
            </div>
          </Link>
        </div>

        {/* Body (Markdown) */}
        <div className="mt-5">
          <MarkdownBody body={post.body} />
        </div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {post.tags.map((t: string) => (
              <Link key={t} href={`/community?q=${encodeURIComponent(t)}`} className="chip text-[11px]">#{t}</Link>
            ))}
          </div>
        )}

        {/* Stats bar */}
        <div className="mt-5 flex items-center gap-4 text-sm text-moai-muted border-t border-moai-border pt-4">
          <LikeButton targetKind="post" targetId={post.id} initialCount={post.like_count} initiallyLiked={!!likedRes.data} />
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.85L3 20l1.4-3.7C3.5 15 3 13.6 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" /></svg>
            {post.comment_count}
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {post.view_count}
          </span>
        </div>
      </article>

      {/* Comments */}
      <div className="mt-8">
        <h2 className="text-base font-semibold mb-4">コメント ({comments?.length ?? 0})</h2>

        <div className="space-y-3">
          {topLevel.map((c: any) => (
            <CommentThread
              key={c.id}
              comment={c}
              replies={repliesMap.get(c.id) ?? []}
              postId={post.id}
              postAuthorId={post.author_id}
              postKind={post.kind}
              isSolved={post.is_solved}
              acceptedCommentId={post.accepted_comment_id}
              userId={user?.id ?? null}
              acceptAnswer={acceptAnswer}
            />
          ))}
        </div>

        {/* New comment form */}
        {user ? (
          <div className="mt-6">
            <CommentForm postId={post.id} />
          </div>
        ) : (
          <div className="mt-6 card text-center py-6">
            <p className="text-sm text-moai-muted">
              コメントするには{" "}
              <Link href="/login" className="text-moai-primary font-medium hover:underline">ログイン</Link>
              {" "}してください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
