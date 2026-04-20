"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function DeliverableForm({ contractId }: { contractId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErr, setFieldErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErr(null);
    if (message.trim().length < 5) {
      setFieldErr("コメントは5文字以上で入力してください");
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
    if (files) {
      for (const f of Array.from(files)) {
        const path = `${contractId}/${Date.now()}-${f.name}`;
        const { error } = await sb.storage.from("deliverables").upload(path, f);
        if (error) {
          toast.error(`アップロード失敗: ${error.message}`);
          setLoading(false);
          return;
        }
        const { data: pub } = sb.storage.from("deliverables").getPublicUrl(path);
        urls.push(pub.publicUrl);
      }
    }

    const { error } = await sb.from("deliverables").insert({
      contract_id: contractId,
      worker_id: user.id,
      message,
      file_urls: urls,
    });
    setLoading(false);
    if (error) {
      toast.error(`提出に失敗しました: ${error.message}`);
      return;
    }
    toast.success("成果物を提出しました");
    setMessage("");
    setFiles(null);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4" noValidate>
      <h3 className="font-semibold text-lg">成果物を提出する</h3>
      <div>
        <label htmlFor="deliv-message" className="label">
          コメント <span className="text-red-500">*</span>
        </label>
        <textarea
          id="deliv-message"
          required
          rows={5}
          className={`input ${fieldErr ? "input-error" : ""}`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="納品内容・確認してほしいポイント"
          aria-invalid={fieldErr ? "true" : undefined}
          aria-describedby={fieldErr ? "deliv-message-error" : undefined}
        />
        {fieldErr && (
          <p id="deliv-message-error" className="mt-1 text-xs text-red-600" role="alert">{fieldErr}</p>
        )}
      </div>
      <div>
        <label htmlFor="deliv-files" className="label">添付ファイル</label>
        <input
          id="deliv-files"
          type="file"
          multiple
          className="input"
          onChange={(e) => setFiles(e.target.files)}
        />
      </div>
      <button disabled={loading} className="btn-primary w-full">
        {loading ? "送信中…" : "提出する"}
      </button>
    </form>
  );
}
