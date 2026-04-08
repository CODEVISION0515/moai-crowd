"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ReviewForm({
  contractId, revieweeId,
}: { contractId: string; revieweeId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { error } = await sb.from("reviews").insert({
      contract_id: contractId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
      comment: comment || null,
    });
    setLoading(false);
    if (error) return setErr(error.message);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <h3 className="font-semibold text-lg">相手を評価する</h3>
      <div>
        <label className="label">評価</label>
        <div className="flex gap-1 text-2xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onClick={() => setRating(n)}
              className={n <= rating ? "text-moai-accent" : "text-slate-300"}>
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">コメント</label>
        <textarea rows={4} className="input" value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button disabled={loading} className="btn-primary w-full">
        {loading ? "..." : "評価を送信する"}
      </button>
    </form>
  );
}
