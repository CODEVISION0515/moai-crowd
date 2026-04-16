"use client";
import { useState } from "react";
import Link from "next/link";
import LikeButton from "./LikeButton";
import CommentForm from "./CommentForm";

type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  like_count: number;
  created_at: string;
  author?: { handle: string; display_name: string; level: number };
};

export default function CommentThread({
  comment,
  replies,
  postId,
  postAuthorId,
  postKind,
  isSolved,
  acceptedCommentId,
  userId,
  acceptAnswer,
}: {
  comment: Comment;
  replies: Comment[];
  postId: string;
  postAuthorId: string;
  postKind: string;
  isSolved: boolean;
  acceptedCommentId: string | null;
  userId: string | null;
  acceptAnswer: (formData: FormData) => Promise<void>;
}) {
  const [showReplies, setShowReplies] = useState(replies.length <= 3);
  const [replying, setReplying] = useState(false);
  const isBest = acceptedCommentId === comment.id;

  return (
    <div className={`card ${isBest ? "border-emerald-400 bg-emerald-50/50" : ""}`}>
      {isBest && (
        <div className="text-xs text-emerald-700 font-semibold mb-2 flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ベストアンサー
        </div>
      )}

      {/* Main comment */}
      <div className="flex items-center justify-between">
        <Link href={`/profile/${comment.author?.handle}`} className="text-sm font-semibold hover:text-moai-primary transition-colors">
          {comment.author?.display_name}{" "}
          <span className="text-xs text-moai-muted font-normal">Lv.{comment.author?.level ?? 1}</span>
        </Link>
        <span className="text-xs text-moai-muted">{timeAgo(comment.created_at)}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{comment.body}</p>

      {/* Actions */}
      <div className="mt-2.5 flex items-center gap-3 text-xs">
        <LikeButton targetKind="comment" targetId={comment.id} initialCount={comment.like_count} initiallyLiked={false} />
        {userId && (
          <button onClick={() => setReplying(!replying)} className="text-moai-muted hover:text-moai-ink transition-colors font-medium">
            返信
          </button>
        )}
        {postKind === "question" && !isSolved && userId === postAuthorId && (
          <form action={acceptAnswer}>
            <input type="hidden" name="comment_id" value={comment.id} />
            <button className="text-emerald-600 hover:underline font-medium">ベストアンサーにする</button>
          </form>
        )}
      </div>

      {/* Reply form (inline) */}
      {replying && userId && (
        <div className="mt-3 ml-6 border-l-2 border-moai-border pl-4">
          <CommentForm postId={postId} parentId={comment.id} replyTo={comment.author?.display_name} onDone={() => setReplying(false)} />
        </div>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mt-3 ml-6 border-l-2 border-moai-border pl-4 space-y-3">
          {!showReplies && (
            <button onClick={() => setShowReplies(true)} className="text-xs text-moai-primary font-medium hover:underline">
              {replies.length}件の返信を表示
            </button>
          )}
          {showReplies && replies.map((r) => (
            <div key={r.id} className="py-2">
              <div className="flex items-center justify-between">
                <Link href={`/profile/${r.author?.handle}`} className="text-xs font-semibold hover:text-moai-primary transition-colors">
                  {r.author?.display_name}{" "}
                  <span className="text-moai-muted font-normal">Lv.{r.author?.level ?? 1}</span>
                </Link>
                <span className="text-[10px] text-moai-muted">{timeAgo(r.created_at)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{r.body}</p>
              <div className="mt-1.5">
                <LikeButton targetKind="comment" targetId={r.id} initialCount={r.like_count} initiallyLiked={false} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return new Date(dateStr).toLocaleDateString("ja-JP");
}
