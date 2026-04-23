"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ProposalForm({
  jobId,
  bankSetupDone = true,
}: {
  jobId: string;
  bankSetupDone?: boolean;
}) {
  const router = useRouter();
  const [coverLetter, setCoverLetter] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [days, setDays] = useState<number>(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  async function generateWithAi() {
    setAiLoading(true);
    const res = await fetch("/api/ai/draft-proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    const data = await res.json();
    if (data.text) {
      setCoverLetter(data.text);
      toast.success("AI下書きを生成しました");
    } else if (data.error) {
      toast.error(data.error);
    }
    setAiLoading(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (coverLetter.trim().length < 10) errors.cover_letter = "メッセージは10文字以上で入力してください";
    if (!amount || amount < 1) errors.amount = "提案金額は1円以上で入力してください";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      toast.error("ログインし直してください");
      setLoading(false);
      return;
    }
    const { error } = await sb.from("proposals").insert({
      job_id: jobId,
      worker_id: user.id,
      cover_letter: coverLetter,
      proposed_amount_jpy: amount,
      proposed_days: days || null,
    });
    setLoading(false);
    if (error) {
      toast.error(`応募に失敗しました: ${error.message}`);
      return;
    }
    toast.success("応募しました");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4" noValidate>
      {!bankSetupDone && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 flex items-start gap-3">
          <span aria-hidden="true" className="text-xl shrink-0">🏦</span>
          <div className="flex-1 min-w-0 text-sm">
            <div className="font-semibold text-amber-900">
              応募前に振込先口座の登録がおすすめ
            </div>
            <p className="mt-0.5 text-xs text-amber-900/80 leading-relaxed">
              契約時に必須となります。今のうちに済ませておくと、採用後すぐ案件を開始できます（約3〜5分）。
            </p>
            <Link
              href="/bank-setup"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-900 underline hover:text-amber-950"
            >
              振込先口座を登録する →
            </Link>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">この案件に応募する</h3>
        <button
          type="button"
          onClick={generateWithAi}
          disabled={aiLoading}
          className="text-xs text-moai-primary hover:underline"
        >
          {aiLoading ? "生成中…" : "✨ AIで下書き"}
        </button>
      </div>
      <div>
        <label htmlFor="proposal-cover" className="label">
          メッセージ <span className="text-red-500">*</span>
        </label>
        <textarea
          id="proposal-cover"
          required
          rows={6}
          className={`input ${fieldErrors.cover_letter ? "input-error" : ""}`}
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="自己紹介・実績・進め方の提案など"
          aria-invalid={fieldErrors.cover_letter ? "true" : undefined}
          aria-describedby={fieldErrors.cover_letter ? "proposal-cover-error" : undefined}
        />
        {fieldErrors.cover_letter && (
          <p id="proposal-cover-error" className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.cover_letter}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="proposal-amount" className="label">
            提案金額 (円) <span className="text-red-500">*</span>
          </label>
          <input
            id="proposal-amount"
            type="number"
            required
            min={1}
            className={`input ${fieldErrors.amount ? "input-error" : ""}`}
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            aria-invalid={fieldErrors.amount ? "true" : undefined}
          />
          {fieldErrors.amount && (
            <p className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.amount}</p>
          )}
        </div>
        <div>
          <label htmlFor="proposal-days" className="label">納期 (日数)</label>
          <input
            id="proposal-days"
            type="number"
            min={0}
            className="input"
            value={days || ""}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        </div>
      </div>
      <button disabled={loading} className="btn-primary w-full">
        {loading ? "送信中…" : "応募する"}
      </button>
    </form>
  );
}
