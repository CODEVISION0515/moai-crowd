import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { formatDateShort } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  discussion: { label: "ディスカッション", icon: "💬", color: "bg-blue-50 text-blue-700" },
  question: { label: "質問", icon: "❓", color: "bg-amber-50 text-amber-700" },
  showcase: { label: "作品シェア", icon: "🎨", color: "bg-purple-50 text-purple-700" },
  announcement: { label: "お知らせ", icon: "📣", color: "bg-red-50 text-red-700" },
};

export default async function FollowingFeedPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  // Get followed user ids
  const { data: follows } = await sb.from("follows")
    .select("followee_id")
    .eq("follower_id", user.id);

  const followeeIds = (follows ?? []).map((f) => f.followee_id);

  let posts: any[] = [];
  if (followeeIds.length > 0) {
    const { data } = await sb.from("posts")
      .select("*, author:author_id(handle, display_name, avatar_url, level)")
      .in("author_id", followeeIds)
      .order("created_at", { ascending: false })
      .limit(50);
    posts = data ?? [];
  }

  return (
    <div className="container-app max-w-4xl py-8 pb-nav">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">フォロー中の投稿</h1>
          <p className="text-sm text-moai-muted mt-1">フォローしているメンバーの最新投稿</p>
        </div>
        <Link href="/community" className="btn-outline btn-sm">すべての投稿</Link>
      </div>

      {followeeIds.length === 0 ? (
        <div className="empty-state py-16">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">まだ誰もフォローしていません</div>
          <div className="empty-state-desc">メンバーをフォローすると、ここに投稿が表示されます</div>
          <Link href="/workers" className="mt-4 btn-accent btn-sm">メンバーを探す</Link>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state py-16">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">フォロー中のメンバーの投稿はまだありません</div>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p: any) => {
            const meta = KIND_LABELS[p.kind] ?? KIND_LABELS.discussion;
            return (
              <Link key={p.id} href={`/community/${p.id}`} className="card-hover group block">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-xs font-semibold text-moai-muted shrink-0">
                    <Avatar src={p.author?.avatar_url} name={p.author?.display_name} size={36} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`badge text-[11px] ${meta.color}`}>{meta.icon} {meta.label}</span>
                      {p.kind === "question" && p.is_solved && <span className="badge-success text-[10px]">解決済み</span>}
                    </div>
                    <h3 className="mt-1.5 font-semibold text-sm group-hover:text-moai-primary transition-colors">{p.title}</h3>
                    <p className="mt-1 text-xs text-moai-muted line-clamp-2">{p.body}</p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-moai-muted">
                      <span>{p.author?.display_name}</span>
                      <span>💬 {p.comment_count}</span>
                      <span>❤️ {p.like_count}</span>
                      <span>{formatDateShort(p.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
