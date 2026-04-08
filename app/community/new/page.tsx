import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function createPost(formData: FormData) {
  "use server";
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const payload = {
    author_id: user.id,
    kind: String(formData.get("kind") || "discussion"),
    title: String(formData.get("title") || "").trim(),
    body: String(formData.get("body") || "").trim(),
    tags: String(formData.get("tags") || "").split(",").map((s) => s.trim()).filter(Boolean),
  };

  const { data, error } = await sb.from("posts").insert(payload).select("id").single();
  if (error) throw error;

  // 初投稿バッジ
  const { count } = await sb.from("posts").select("*", { count: "exact", head: true }).eq("author_id", user.id);
  if (count === 1) await sb.rpc("award_badge", { p_user_id: user.id, p_slug: "first_post" });
  await sb.rpc("award_xp", { p_user_id: user.id, p_reason: "post_created", p_amount: 10, p_meta: null });

  revalidatePath("/community");
  redirect(`/community/${data.id}`);
}

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">新しい投稿</h1>
      <form action={createPost} className="card space-y-4">
        <div>
          <label className="label">投稿タイプ</label>
          <select name="kind" className="input">
            <option value="discussion">💬 ディスカッション</option>
            <option value="question">❓ 質問</option>
            <option value="showcase">🎨 作品シェア</option>
          </select>
        </div>
        <div>
          <label className="label">タイトル *</label>
          <input name="title" required className="input" />
        </div>
        <div>
          <label className="label">本文 *</label>
          <textarea name="body" required rows={10} className="input" placeholder="Markdown可" />
        </div>
        <div>
          <label className="label">タグ (カンマ区切り)</label>
          <input name="tags" className="input" placeholder="AI, 初心者, 雑談" />
        </div>
        <button className="btn-primary w-full">投稿する</button>
      </form>
    </div>
  );
}
