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
        <button className="btn-primary w-full">投稿する</button>
      </ToastForm>
    </div>
  );
}
