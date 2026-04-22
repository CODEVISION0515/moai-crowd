import { ToastForm } from "@/components/ToastForm";
import { FieldError } from "@/components/FieldError";
import { FieldInput, FieldTextarea } from "@/components/Field";
import { createPost } from "./actions";

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">新しい投稿</h1>
      <ToastForm action={createPost} className="card space-y-4" noValidate>
        <div>
          <label htmlFor="post-kind" className="label">投稿タイプ</label>
          <select id="post-kind" name="kind" className="input" defaultValue="discussion">
            <option value="discussion">💬 ディスカッション</option>
            <option value="question">❓ 質問</option>
            <option value="showcase">🎨 作品シェア</option>
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

        <button className="btn-primary w-full">投稿する</button>
      </ToastForm>
    </div>
  );
}
