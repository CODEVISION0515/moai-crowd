"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ReviewForm({
  contractId, revieweeId,
}: { contractId: string; revieweeId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      toast.error("ログインし直してください");
      setLoading(false);
      return;
    }
    const { error } = await sb.from("reviews").insert({
      contract_id: contractId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
      comment: comment || null,
    });
    setLoading(false);
    if (error) {
      toast.error(`評価の送信に失敗しました: ${error.message}`);
      return;
    }
    toast.success("評価を送信しました");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4" noValidate>
      <h3 className="font-semibold text-lg">相手を評価する</h3>
      <div>
        <span id="rating-label" className="label">評価</span>
        <div
          role="radiogroup"
          aria-labelledby="rating-label"
          className="flex gap-1 text-2xl"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              role="radio"
              aria-checked={n === rating}
              aria-label={`星${n}つ`}
              className={`transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moai-primary/30 rounded ${
                n <= rating ? "text-moai-accent" : "text-slate-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="review-comment" className="label">コメント</label>
        <textarea
          id="review-comment"
          rows={4}
          className="input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <button disabled={loading} className="btn-primary w-full">
        {loading ? "送信中…" : "評価を送信する"}
      </button>
    </form>
  );
}
