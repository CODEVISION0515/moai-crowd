import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { formatDateJP } from "@/lib/utils";
import { createInterview, togglePublishInterview } from "./actions";
import { ToastForm } from "@/components/ToastForm";
import { FieldError } from "@/components/FieldError";
import { FieldInput, FieldTextarea } from "@/components/Field";

export const dynamic = "force-dynamic";

export default async function AdminInterviewsPage() {
  const admin = createAdminClient();
  const [{ data: interviews }, { data: cohorts }] = await Promise.all([
    admin
      .from("interviews")
      .select("id, slug, title, is_published, published_at, view_count, cohort_id, cohorts:cohort_id(name), subject:subject_user_id(handle, display_name)")
      .order("created_at", { ascending: false })
      .limit(100),
    admin.from("cohorts").select("id, name").order("id"),
  ]);

  return (
    <div className="space-y-6">
      {/* Create form */}
      <details className="card">
        <summary className="cursor-pointer font-semibold text-sm flex items-center justify-between">
          + 新しいインタビュー記事を作成
        </summary>
        <ToastForm action={createInterview} className="mt-4 space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="slug" className="label">スラッグ (URL用) <span className="text-red-500">*</span></label>
              <FieldInput id="slug" name="slug" required placeholder="yamada-taro-cohort-1" />
              <FieldError name="slug" />
            </div>
            <div>
              <label htmlFor="cohort_id" className="label">期</label>
              <select id="cohort_id" name="cohort_id" className="input">
                <option value="">指定なし</option>
                {cohorts?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="subject_handle" className="label">対象者のハンドル</label>
            <FieldInput id="subject_handle" name="subject_handle" placeholder="yamada_taro" />
            <FieldError name="subject_handle" />
          </div>

          <div>
            <label htmlFor="title" className="label">タイトル <span className="text-red-500">*</span></label>
            <FieldInput id="title" name="title" required maxLength={200} placeholder="受講1ヶ月で初受注！山田さんの学び" />
            <FieldError name="title" />
          </div>

          <div>
            <label htmlFor="summary" className="label">サマリー (1-2行)</label>
            <FieldTextarea id="summary" name="summary" rows={2} maxLength={300} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="before_text" className="label">Before (受講前)</label>
              <FieldTextarea id="before_text" name="before_text" rows={3} />
            </div>
            <div>
              <label htmlFor="after_text" className="label">After (受講後)</label>
              <FieldTextarea id="after_text" name="after_text" rows={3} />
            </div>
          </div>

          <div>
            <label htmlFor="hero_image_url" className="label">ヒーロー画像URL</label>
            <FieldInput id="hero_image_url" name="hero_image_url" type="url" placeholder="https://..." />
          </div>

          <div>
            <label htmlFor="body" className="label">本文 (Markdown) <span className="text-red-500">*</span></label>
            <FieldTextarea id="body" name="body" required rows={10} placeholder="## 受講前の状態&#10;&#10;..." />
            <FieldError name="body" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="publish_now" className="h-4 w-4" />
            <span>公開する (チェックしないと下書き保存)</span>
          </label>

          <button className="btn-primary">記事を作成</button>
        </ToastForm>
      </details>

      {/* List */}
      {interviews && interviews.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th scope="col" className="p-3">タイトル</th>
                <th scope="col" className="p-3">対象</th>
                <th scope="col" className="p-3">期</th>
                <th scope="col" className="p-3">状態</th>
                <th scope="col" className="p-3">閲覧</th>
                <th scope="col" className="p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((iv: any) => (
                <tr key={iv.id} className="border-t border-slate-200">
                  <td className="p-3">
                    {iv.is_published ? (
                      <Link href={`/school/interviews/${iv.slug}`} target="_blank" className="font-semibold hover:text-moai-primary">
                        {iv.title}
                      </Link>
                    ) : (
                      <span className="font-semibold">{iv.title}</span>
                    )}
                    <div className="text-xs text-slate-500">/{iv.slug}</div>
                  </td>
                  <td className="p-3 text-xs">{iv.subject?.display_name ?? "-"}</td>
                  <td className="p-3 text-xs">{iv.cohorts?.name ?? "-"}</td>
                  <td className="p-3">
                    {iv.is_published ? (
                      <span className="badge-success">公開中</span>
                    ) : (
                      <span className="badge-slate">下書き</span>
                    )}
                  </td>
                  <td className="p-3 text-xs">👁 {iv.view_count ?? 0}</td>
                  <td className="p-3">
                    <ToastForm action={togglePublishInterview} className="inline-flex">
                      <input type="hidden" name="id" value={iv.id} />
                      <input type="hidden" name="publish" value={iv.is_published ? "false" : "true"} />
                      <button className={iv.is_published ? "btn-outline btn-sm" : "btn-primary btn-sm"}>
                        {iv.is_published ? "非公開" : "公開"}
                      </button>
                    </ToastForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="🎙" title="インタビュー記事はまだありません" description="上のフォームから最初の記事を作成してみましょう" />
      )}
    </div>
  );
}
