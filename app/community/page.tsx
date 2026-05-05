import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CommunityChat from "./CommunityChat";

export const dynamic = "force-dynamic";

type ChatMessageRow = {
  id: string;
  sender_id: string;
  body: string;
  reply_to_id: string | null;
  created_at: string;
  sender: {
    handle: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type AnnouncementRow = {
  id: string;
  title: string;
  author: { display_name: string | null; handle: string | null } | null;
  created_at: string;
};

export default async function CommunityPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  // 直近 80 件を昇順 (古い → 新しい) で取得
  const { data: messagesDesc } = await sb
    .from("community_messages")
    .select(
      "id, sender_id, body, reply_to_id, created_at, sender:sender_id(handle, display_name, avatar_url)",
    )
    .order("created_at", { ascending: false })
    .limit(80);
  const initialMessages = ((messagesDesc ?? []) as unknown as ChatMessageRow[])
    .slice()
    .reverse();

  // ピン留め: 直近 7 日のお知らせ投稿の最新
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: announcement } = await sb
    .from("posts")
    .select("id, title, created_at, author:author_id(display_name, handle)")
    .eq("kind", "announcement")
    .eq("visibility", "public")
    .gt("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<AnnouncementRow | null>();

  return (
    <div className="container-app max-w-3xl py-4 md:py-6 pb-nav space-y-3">
      {/* Header */}
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <span aria-hidden="true">🌱</span>
            ゆんたくチャット
            <span className="badge text-[10px] bg-emerald-50 text-emerald-700">誰でもOK</span>
          </h1>
          <p className="text-xs text-moai-muted mt-0.5">
            気軽に話す広場。質問・作品共有など長文は{" "}
            <Link href="/community/posts" className="text-moai-primary hover:underline">投稿一覧</Link>{" "}
            へ
          </p>
        </div>
        <nav aria-label="コミュニティセクション" className="flex items-center gap-1 text-xs">
          <Link
            href="/community/posts"
            className="px-3 py-1.5 rounded-md text-moai-muted hover:bg-moai-cloud hover:text-moai-ink transition-colors"
          >
            📋 投稿一覧
          </Link>
          {user && (
            <Link
              href="/community/feed"
              className="px-3 py-1.5 rounded-md text-moai-muted hover:bg-moai-cloud hover:text-moai-ink transition-colors"
            >
              👥 フォロー
            </Link>
          )}
        </nav>
      </header>

      {/* Pinned announcement */}
      {announcement && (
        <Link
          href={`/community/${announcement.id}`}
          className="card-hover block border-amber-200 bg-amber-50/50 hover:bg-amber-50"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0" aria-hidden="true">📣</span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                お知らせ
              </div>
              <div className="font-medium text-sm line-clamp-1">{announcement.title}</div>
              {announcement.author?.display_name && (
                <div className="text-[11px] text-moai-muted mt-0.5">
                  by {announcement.author.display_name}
                </div>
              )}
            </div>
            <span className="text-moai-muted text-xs shrink-0" aria-hidden="true">→</span>
          </div>
        </Link>
      )}

      {/* Chat */}
      <CommunityChat
        userId={user?.id ?? null}
        initial={initialMessages}
      />
    </div>
  );
}
