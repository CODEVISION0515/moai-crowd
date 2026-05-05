import { createClient } from "@/lib/supabase/server";
import { ToastForm } from "@/components/ToastForm";
import { FieldError } from "@/components/FieldError";
import { FieldInput, FieldTextarea } from "@/components/Field";
import { SubmitButton } from "@/components/SubmitButton";
import { createPost } from "./actions";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string; kind?: string; pinned?: string }>;
}) {
  const sp = await searchParams;
  const cohortId = sp.cohort ? Number(sp.cohort) : null;
  const defaultKind = sp.kind || "discussion";
  const defaultPinned = sp.pinned === "1";

  // cohort 指定があれば cohort 情報を取得 (存在確認用)
  let cohortName: string | null = null;
  if (cohortId) {
    const sb = await createClient();
    const { data } = await sb.from("cohorts").select("name").eq("id", cohortId).maybeSingle();
    cohortName = data?.name ?? null;
  }

  return (
    <div className="container-app max-w-2xl py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">新しい投稿</h1>
      {cohortName && (
        <div className="mb-6 flex items-center gap-2 text-sm">
          <span className="badge-accent text-[11px]">🎓 {cohortName}</span>
          <span className="text-moai-muted">に投稿します</span>
        </div>
      )}
      <ToastForm action={createPost} className="card space-y-4" noValidate>
        {cohortId && <input type="hidden" name="cohort_id" value={cohortId} />}
        {defaultPinned && <input type="hidden" name="is_pinned" value="1" />}

        <div>
          <label htmlFor="post-kind" className="label">投稿タイプ</label>
          <select id="post-kind" name="kind" className="input" defaultValue={defaultKind}>
            <option value="discussion">💬 ディスカッション</option>
            <option value="question">❓ 質問</option>
            <option value="showcase">🎨 作品シェア</option>
            {cohortId && <option value="announcement">📣 お知らせ (講師用)</option>}
          </select>
        </div>
        <div>
          <label htmlFor="post-title" className="label">
            タイトル <span className="text-red-500">*</span>
          </label>
          <FieldInput id="post-title" name="title" required maxLength={200} />
          <FieldError name="title" />
        </div>
        <div>
          <label htmlFor="post-body" className="label">
            本文 <span className="text-red-500">*</span>
          </label>
          <FieldTextarea id="post-body" name="body" required rows={10} placeholder="Markdown可" />
          <FieldError name="body" />
        </div>
        <div>
          <label htmlFor="post-tags" className="label">タグ (カンマ区切り)</label>
          <input id="post-tags" name="tags" className="input" placeholder="AI, 初心者, 雑談" />
        </div>

        {cohortId && (
          <div>
            <label htmlFor="post-week" className="label">第何週 (任意)</label>
            <input
              id="post-week"
              name="week_number"
              type="number"
              min="1"
              max="52"
              className="input"
              placeholder="例: 1, 2, 3..."
            />
            <p className="mt-1 text-[11px] text-moai-muted">授業週ごとに整理するため (宿題・授業資料)</p>
          </div>
        )}

        {/* 公開レベル */}
        <div className="pt-2 border-t border-moai-border">
          <span className="label">公開レベル</span>
          <p className="text-[11px] text-moai-muted mb-2">
            どこまで見せるか選べます。デフォルトは全公開（一番届きます）
          </p>
          <div className="space-y-2">
            <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-moai-border hover:bg-moai-cloud transition-colors">
              <input type="radio" name="visibility" value="public" defaultChecked className="mt-0.5 h-4 w-4 text-moai-primary" />
              <div>
                <div className="text-sm font-medium">🌐 全公開</div>
                <div className="text-[11px] text-moai-muted">未登録者も含め誰でも閲覧可 · 一番届きやすい</div>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-moai-border hover:bg-moai-cloud transition-colors">
              <input type="radio" name="visibility" value="members" className="mt-0.5 h-4 w-4 text-moai-primary" />
              <div>
                <div className="text-sm font-medium">👥 メンバー限定</div>
                <div className="text-[11px] text-moai-muted">MOAIに登録済みのユーザーだけが閲覧可</div>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-moai-border hover:bg-moai-cloud transition-colors">
              <input type="radio" name="visibility" value="school" className="mt-0.5 h-4 w-4 text-moai-primary" />
              <div>
                <div className="text-sm font-medium">🎓 School限定</div>
                <div className="text-[11px] text-moai-muted">在校生・卒業生・講師のみ · 相談や濃い内容向き</div>
              </div>
            </label>
          </div>
        </div>

        <SubmitButton block pendingLabel="投稿中…">投稿する</SubmitButton>
      </ToastForm>
    </div>
  );
}
