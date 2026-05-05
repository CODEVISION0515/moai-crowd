"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const RATING_HINTS: Record<number, string> = {
  1: "とても残念だった",
  2: "あまり良くなかった",
  3: "普通",
  4: "満足できた",
  5: "とても満足",
};

export default function ReviewForm({
  contractId,
  revieweeId,
}: {
  contractId: string;
  revieweeId: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
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
      comment: comment.trim() || null,
    });
    setLoading(false);
    if (error) {
      toast.error(`評価の送信に失敗しました: ${error.message}`);
      return;
    }
    toast.success("評価を送信しました。ありがとうございました。");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <span id="rating-label" className="label">
          評価 <span className="text-red-500">*</span>
        </span>
        <div
          role="radiogroup"
          aria-labelledby="rating-label"
          className="flex items-center gap-1 text-3xl"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              role="radio"
              aria-checked={n === rating}
              aria-label={`星${n}つ`}
              className={`transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moai-primary/30 rounded hover:scale-110 ${
                n <= rating ? "text-moai-accent" : "text-slate-300"
              }`}
            >
              ★
            </button>
          ))}
          <span className="ml-3 text-sm text-moai-muted">{RATING_HINTS[rating]}</span>
        </div>
      </div>
      <div>
        <label htmlFor="review-comment" className="label">
          コメント <span className="text-moai-muted text-xs font-normal">（任意）</span>
        </label>
        <textarea
          id="review-comment"
          rows={4}
          className="input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="良かった点・改善してほしい点を一言"
        />
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
            送信中…
          </>
        ) : (
          "評価を送信する"
        )}
      </button>
    </form>
  );
}
