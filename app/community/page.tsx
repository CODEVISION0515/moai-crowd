import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  discussion: { label: "ディスカッション", icon: "💬", color: "bg-blue-100 text-blue-700" },
  question: { label: "質問", icon: "❓", color: "bg-amber-100 text-amber-700" },
  showcase: { label: "作品シェア", icon: "🎨", color: "bg-purple-100 text-purple-700" },
  announcement: { label: "お知らせ", icon: "📣", color: "bg-red-100 text-red-700" },
};

export default async function CommunityPage({
  searchParams,
}: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const sb = await createClient();

  let q = sb.from("posts")
    .select("*, author:author_id(handle, display_name, avatar_url, level)")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (kind) q = q.eq("kind", kind);

  const { data: posts } = await q;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">コミュニティ</h1>
        <Link href="/community/new" className="btn-primary">+ 投稿する</Link>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        <Link href="/community" className={`badge ${!kind ? "bg-moai-primary text-white" : ""}`}>すべて</Link>
        {Object.entries(KIND_LABELS).map(([k, v]) => (
          <Link key={k} href={`/community?kind=${k}`}
            className={`badge ${kind === k ? "bg-moai-primary text-white" : v.color}`}>
            {v.icon} {v.label}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {posts?.map((p: any) => {
          const meta = KIND_LABELS[p.kind];
          return (
            <Link key={p.id} href={`/community/${p.id}`} className="card block hover:shadow-md transition">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`badge ${meta.color}`}>{meta.icon} {meta.label}</span>
                    {p.kind === "question" && p.is_solved && (
                      <span className="badge bg-green-100 text-green-700">✓ 解決済み</span>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{p.body}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span>by {p.author?.display_name} Lv.{p.author?.level ?? 1}</span>
                    <span>💬 {p.comment_count}</span>
                    <span>❤️ {p.like_count}</span>
                    <span>{new Date(p.updated_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {(!posts || posts.length === 0) && (
          <p className="text-center text-slate-500 py-10">まだ投稿がありません</p>
        )}
      </div>
    </div>
  );
}
