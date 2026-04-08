import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function createEvent(formData: FormData) {
  "use server";
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await sb.from("events").insert({
    host_id: user.id,
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    location: String(formData.get("location") || "") || null,
    meeting_url: String(formData.get("meeting_url") || "") || null,
    starts_at: String(formData.get("starts_at")),
    ends_at: String(formData.get("ends_at") || "") || null,
    capacity: Number(formData.get("capacity") || 0) || null,
    tags: String(formData.get("tags") || "").split(",").map((s) => s.trim()).filter(Boolean),
  }).select("id").single();
  if (error) throw error;

  // 初イベント主催バッジ
  const { count } = await sb.from("events").select("*", { count: "exact", head: true }).eq("host_id", user.id);
  if (count === 1) await sb.rpc("award_badge", { p_user_id: user.id, p_slug: "event_host" });

  redirect(`/events/${data.id}`);
}

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">イベントを作成</h1>
      <form action={createEvent} className="card space-y-4">
        <div>
          <label className="label">タイトル *</label>
          <input name="title" required className="input" />
        </div>
        <div>
          <label className="label">説明 *</label>
          <textarea name="description" required rows={5} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">開始 *</label>
            <input name="starts_at" type="datetime-local" required className="input" />
          </div>
          <div>
            <label className="label">終了</label>
            <input name="ends_at" type="datetime-local" className="input" />
          </div>
        </div>
        <div>
          <label className="label">場所</label>
          <input name="location" className="input" placeholder="本部町 or オンライン" />
        </div>
        <div>
          <label className="label">ミーティングURL (オンラインの場合)</label>
          <input name="meeting_url" type="url" className="input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">定員</label>
            <input name="capacity" type="number" min="0" className="input" />
          </div>
          <div>
            <label className="label">タグ</label>
            <input name="tags" className="input" placeholder="勉強会,AI" />
          </div>
        </div>
        <button className="btn-primary w-full">作成する</button>
      </form>
    </div>
  );
}
