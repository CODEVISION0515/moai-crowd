"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeliverableForm({ contractId }: { contractId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setErr("未ログイン"); setLoading(false); return; }

    const urls: string[] = [];
    if (files) {
      for (const f of Array.from(files)) {
        const path = `${contractId}/${Date.now()}-${f.name}`;
        const { error } = await sb.storage.from("deliverables").upload(path, f);
        if (error) { setErr(error.message); setLoading(false); return; }
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
    if (error) return setErr(error.message);
    setMessage(""); setFiles(null);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <h3 className="font-semibold text-lg">成果物を提出する</h3>
      <div>
        <label className="label">コメント *</label>
        <textarea required rows={5} className="input" value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="納品内容・確認してほしいポイント" />
      </div>
      <div>
        <label className="label">添付ファイル</label>
        <input type="file" multiple className="input" onChange={(e) => setFiles(e.target.files)} />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button disabled={loading} className="btn-primary w-full">
        {loading ? "送信中..." : "提出する"}
      </button>
    </form>
  );
}
