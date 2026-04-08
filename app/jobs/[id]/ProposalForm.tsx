"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProposalForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [coverLetter, setCoverLetter] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [days, setDays] = useState<number>(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setErr("ログインしてください"); setLoading(false); return; }
    const { error } = await sb.from("proposals").insert({
      job_id: jobId,
      worker_id: user.id,
      cover_letter: coverLetter,
      proposed_amount_jpy: amount,
      proposed_days: days || null,
    });
    setLoading(false);
    if (error) return setErr(error.message);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <h3 className="font-semibold text-lg">この案件に応募する</h3>
      <div>
        <label className="label">メッセージ *</label>
        <textarea required rows={6} className="input" value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="自己紹介・実績・進め方の提案など" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">提案金額 (円) *</label>
          <input type="number" required min={1} className="input" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">納期 (日数)</label>
          <input type="number" min={0} className="input" value={days || ""} onChange={(e) => setDays(Number(e.target.value))} />
        </div>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button disabled={loading} className="btn-primary w-full">
        {loading ? "送信中..." : "応募する"}
      </button>
    </form>
  );
}
