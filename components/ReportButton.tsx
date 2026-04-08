"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ReportButton({
  targetKind, targetId,
}: { targetKind: "user" | "job" | "proposal" | "message" | "deliverable"; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return alert("ログインが必要です");
    await sb.from("reports").insert({
      reporter_id: user.id, target_kind: targetKind, target_id: targetId, reason, detail,
    });
    setDone(true);
    setTimeout(() => { setOpen(false); setDone(false); setReason(""); setDetail(""); }, 1500);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-slate-400 hover:text-red-500">
        通報
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">通報する</h3>
            {done ? (
              <p className="mt-4 text-sm text-green-700">通報を送信しました。ご協力ありがとうございます。</p>
            ) : (
              <>
                <div className="mt-3">
                  <label className="label">理由 *</label>
                  <select required className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
                    <option value="">選択してください</option>
                    <option>スパム・宣伝</option>
                    <option>不適切な内容</option>
                    <option>詐欺・虚偽</option>
                    <option>著作権侵害</option>
                    <option>ハラスメント</option>
                    <option>その他</option>
                  </select>
                </div>
                <div className="mt-3">
                  <label className="label">詳細</label>
                  <textarea rows={4} className="input" value={detail} onChange={(e) => setDetail(e.target.value)} />
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setOpen(false)} className="btn-outline flex-1">キャンセル</button>
                  <button onClick={submit} disabled={!reason} className="btn-primary flex-1">送信</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
