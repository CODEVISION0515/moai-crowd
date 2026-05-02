"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_FILES = 5;

export default function DeliverableForm({ contractId }: { contractId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [fieldErr, setFieldErr] = useState<string | null>(null);

  function onMessageChange(value: string) {
    setMessage(value);
    if (fieldErr) setFieldErr(null);
  }

  function onFilesChange(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list);
    if (arr.length > MAX_FILES) {
      toast.error(`添付は最大 ${MAX_FILES} ファイルまでです`);
      return;
    }
    const tooLarge = arr.find((f) => f.size > MAX_FILE_BYTES);
    if (tooLarge) {
      toast.error(`「${tooLarge.name}」は 25MB を超えています`);
      return;
    }
    setFiles(arr);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setFieldErr(null);
    if (message.trim().length < 5) {
      setFieldErr("コメントは 5 文字以上で入力してください");
      return;
    }
    setLoading(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      toast.error("ログインし直してください");
      setLoading(false);
      return;
    }

    const urls: string[] = [];
    if (files.length > 0) {
      setProgress({ current: 0, total: files.length });
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const safeName = f.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `${contractId}/${Date.now()}-${i}-${safeName}`;
        const { error } = await sb.storage.from("deliverables").upload(path, f);
        if (error) {
          toast.error(`「${f.name}」のアップロードに失敗しました: ${error.message}`);
          setLoading(false);
          setProgress(null);
          return;
        }
        const { data: pub } = sb.storage.from("deliverables").getPublicUrl(path);
        urls.push(pub.publicUrl);
        setProgress({ current: i + 1, total: files.length });
      }
    }

    const { error } = await sb.from("deliverables").insert({
      contract_id: contractId,
      worker_id: user.id,
      message: message.trim(),
      file_urls: urls,
    });
    setLoading(false);
    setProgress(null);
    if (error) {
      toast.error(`提出に失敗しました: ${error.message}`);
      return;
    }
    toast.success("成果物を提出しました。発注者の確認をお待ちください。");
    setMessage("");
    setFiles([]);
    router.refresh();
  }

  const charCount = message.trim().length;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="deliv-message" className="label">
          納品コメント <span className="text-red-500">*</span>
        </label>
        <textarea
          id="deliv-message"
          required
          rows={5}
          className={`input ${fieldErr ? "input-error" : ""}`}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="納品内容・確認してほしいポイントを書きましょう"
          aria-invalid={fieldErr ? "true" : undefined}
          aria-describedby={fieldErr ? "deliv-message-error" : "deliv-message-hint"}
        />
        <div className="mt-1 flex justify-between text-xs">
          {fieldErr ? (
            <p id="deliv-message-error" className="text-red-600" role="alert">
              {fieldErr}
            </p>
          ) : (
            <p id="deliv-message-hint" className="text-moai-muted">
              5 文字以上
            </p>
          )}
          <span className={`tabular-nums ${charCount < 5 ? "text-moai-muted" : "text-moai-ink"}`}>
            {charCount} 文字
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="deliv-files" className="label">
          添付ファイル <span className="text-moai-muted text-xs font-normal">（任意・最大 {MAX_FILES} 件・1 件 25MB まで）</span>
        </label>
        <input
          id="deliv-files"
          type="file"
          multiple
          className="input"
          onChange={(e) => onFilesChange(e.target.files)}
        />
        {files.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded bg-moai-cloud px-2 py-1.5">
                <span className="truncate">📎 {f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-moai-muted hover:text-red-600 shrink-0"
                  aria-label={`${f.name} を削除`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="btn-primary w-full inline-flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {progress
              ? `アップロード中… (${progress.current}/${progress.total})`
              : "送信中…"}
          </>
        ) : (
          "提出する"
        )}
      </button>
    </form>
  );
}
