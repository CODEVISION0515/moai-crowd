import Link from "next/link";
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

const SORT_OPTIONS = [
  { key: "newest", label: "新着" },
  { key: "hot", label: "人気" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return formatDateShort(dateStr);
}

export default async function CommunityPage({
  searchParams,
}: { searchParams: Promise<{ kind?: string; sort?: string; q?: string }> }) {
  const { kind, sort, q } = await searchParams;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  let posts: any[] | null = null;

  if (q && q.trim()) {
    // Search mode
    const { data } = await sb.rpc("search_posts", { q, kind_filter: kind ?? null });
    posts = data;
  } else {
    // Regular mode
    let query = sb.from("posts")
      .select("*, author:author_id(handle, display_name, avatar_url, level)")
      .limit(50);
    if (kind) query = query.eq("kind", kind);
    if (sort === "hot") {
      query = query.order("hot_score", { ascending: false });
    } else {
      query = query.order("updated_at", { ascending: false });
    }
    const { data } = await query;
    posts = data;

    // For search results, fetch author info
    if (q && posts) {
      const authorIds = [...new Set(posts.map((p: any) => p.author_id))];
      if (authorIds.length > 0) {
        const { data: authors } = await sb.from("profiles")
          .select("id, handle, display_name, avatar_url, level")
          .in("id", authorIds);
        const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));
        posts = posts.map((p: any) => ({ ...p, author: authorMap.get(p.author_id) }));
      }
    }
  }

  // Build search param helpers
  const buildUrl = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    if (params.kind) sp.set("kind", params.kind);
    if (params.sort) sp.set("sort", params.sort);
    if (params.q) sp.set("q", params.q);
    const qs = sp.toString();
    return `/community${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="container-app max-w-4xl py-8 pb-nav">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">コミュニティ</h1>
          <p className="text-sm text-moai-muted mt-1">ナレッジを共有し、仲間とつながる</p>
        </div>
        <Link href="/community/new" className="btn-accent gap-1">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          投稿する
        </Link>
      </div>

      {/* Search */}
      <form className="mb-5">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            name="q"
            defaultValue={q}
            placeholder="投稿を検索..."
            className="input pl-10"
          />
          {kind && <input type="hidden" name="kind" value={kind} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
        </div>
      </form>

      {/* Filters: Sort + Kind + Feed link */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Sort tabs */}
        <div className="flex gap-1 bg-moai-cloud rounded-lg p-0.5">
          {SORT_OPTIONS.map((s) => {
            const active = (sort ?? "newest") === s.key;
            return (
              <Link
                key={s.key}
                href={buildUrl({ kind, sort: s.key === "newest" ? undefined : s.key, q })}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  active ? "bg-white text-moai-ink shadow-soft" : "text-moai-muted hover:text-moai-ink"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>

        <div className="h-4 w-px bg-moai-border" />

        {/* Kind filters */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          <Link
            href={buildUrl({ sort, q })}
            className={`chip whitespace-nowrap ${!kind ? "chip-active" : ""}`}
          >
            すべて
          </Link>
          {Object.entries(KIND_LABELS).map(([k, v]) => (
            <Link
              key={k}
              href={buildUrl({ kind: k, sort, q })}
              className={`chip whitespace-nowrap ${kind === k ? "chip-active" : ""}`}
            >
              {v.icon} {v.label}
            </Link>
          ))}
        </div>

        {/* Follow feed link */}
        {user && (
          <>
            <div className="h-4 w-px bg-moai-border hidden sm:block" />
            <Link href="/community/feed" className="text-xs font-medium text-moai-primary hover:underline hidden sm:block">
              フォロー中の投稿
            </Link>
          </>
        )}
      </div>

      {/* Search results indicator */}
      {q && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-moai-muted">「{q}」の検索結果: {posts?.length ?? 0}件</span>
          <Link href={buildUrl({ kind, sort })} className="text-xs text-moai-muted hover:text-moai-ink">クリア</Link>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-3">
        {posts?.map((p: any) => {
          const meta = KIND_LABELS[p.kind] ?? KIND_LABELS.discussion;
          const isNew = Date.now() - new Date(p.created_at).getTime() < 86400_000;
          return (
            <Link key={p.id} href={`/community/${p.id}`} className="card-hover group block">
              <div className="flex items-start gap-3">
                {/* Author avatar */}
                <div className="hidden sm:flex h-9 w-9 rounded-full overflow-hidden bg-moai-cloud items-center justify-center text-xs font-semibold text-moai-muted shrink-0">
                  <Avatar src={p.author?.avatar_url} name={p.author?.display_name} size={36} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`badge text-[11px] ${meta.color}`}>{meta.icon} {meta.label}</span>
                    {p.kind === "question" && p.is_solved && (
                      <span className="badge-success text-[10px]">解決済み</span>
                    )}
                    {isNew && <span className="badge-new text-[10px]">NEW</span>}
                  </div>

                  {/* Title */}
                  <h3 className="mt-1.5 font-semibold text-sm group-hover:text-moai-primary transition-colors leading-snug">
                    {p.title}
                  </h3>

                  {/* Preview */}
                  <p className="mt-1 text-xs text-moai-muted line-clamp-2 leading-relaxed">{p.body}</p>

                  {/* Meta */}
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-moai-muted">
                    <span>{p.author?.display_name} Lv.{p.author?.level ?? 1}</span>
                    <span className="flex items-center gap-0.5">💬 {p.comment_count}</span>
                    <span className="flex items-center gap-0.5">❤️ {p.like_count}</span>
                    <span>{timeAgo(p.updated_at ?? p.created_at)}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {(!posts || posts.length === 0) && (
          <div className="empty-state py-16">
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-title">{q ? "検索結果がありません" : "まだ投稿がありません"}</div>
            <div className="empty-state-desc">{q ? "別のキーワードで試してみてください" : "最初の投稿をしてコミュニティを盛り上げましょう"}</div>
            {!q && <Link href="/community/new" className="mt-4 btn-accent btn-sm">投稿する</Link>}
          </div>
        )}
      </div>
    </div>
  );
}
