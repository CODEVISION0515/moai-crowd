import { createClient } from "@/lib/supabase/server";
import AIDraftPanel from "./AIDraftPanel";
import { createJob } from "./actions";

export default async function NewJobPage() {
  const sb = await createClient();
  const { data: categories } = await sb.from("categories").select("slug, label").order("sort_order");
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">案件を投稿する</h1>
      <AIDraftPanel />
      <form action={createJob} className="card space-y-5">
        <div>
          <label className="label">タイトル *</label>
          <input name="title" required className="input" placeholder="例: LP制作をお願いします" />
        </div>
        <div>
          <label className="label">詳細説明 *</label>
          <textarea name="description" required rows={8} className="input" placeholder="目的・対象・納期・求めるスキルなど" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">カテゴリ</label>
            <select name="category" className="input">
              {categories?.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">形態</label>
            <select name="budget_type" className="input">
              <option value="fixed">固定報酬</option>
              <option value="hourly">時給</option>
            </select>
          </div>
          <div>
            <label className="label">予算 最低 (円)</label>
            <input name="budget_min" type="number" min="0" className="input" />
          </div>
          <div>
            <label className="label">予算 最高 (円)</label>
            <input name="budget_max" type="number" min="0" className="input" />
          </div>
          <div>
            <label className="label">希望スキル (カンマ区切り)</label>
            <input name="skills" className="input" placeholder="React, Figma, SEO" />
          </div>
          <div>
            <label className="label">締切</label>
            <input name="deadline" type="date" className="input" />
          </div>
        </div>
        <button className="btn-primary w-full">案件を公開する</button>
      </form>
    </div>
  );
}
