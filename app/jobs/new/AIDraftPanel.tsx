"use client";
import { useState } from "react";

export default function AIDraftPanel() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setLoading(true); setErr(null);
    const res = await fetch("/api/ai/draft-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setErr(data.error ?? "生成に失敗しました");

    // フォームに反映
    const form = document.querySelector("form") as HTMLFormElement;
    if (!form) return;
    (form.elements.namedItem("title") as HTMLInputElement).value = data.title ?? "";
    (form.elements.namedItem("description") as HTMLTextAreaElement).value = data.description ?? "";
    if (data.category) (form.elements.namedItem("category") as HTMLSelectElement).value = data.category;
    if (data.skills?.length) (form.elements.namedItem("skills") as HTMLInputElement).value = data.skills.join(", ");
    if (data.budget_min_jpy) (form.elements.namedItem("budget_min") as HTMLInputElement).value = String(data.budget_min_jpy);
    if (data.budget_max_jpy) (form.elements.namedItem("budget_max") as HTMLInputElement).value = String(data.budget_max_jpy);
  }

  return (
    <details className="card bg-gradient-to-br from-moai-primary/5 to-moai-accent/5 border-moai-primary/20 mb-4">
      <summary className="cursor-pointer font-semibold">✨ AIで下書きを生成</summary>
      <div className="mt-3 space-y-3">
        <p className="text-sm text-slate-600">
          ざっくりしたアイデアを入れてください。AIがタイトル・説明・予算まで自動で作成します。
        </p>
        <textarea
          rows={3}
          className="input"
          placeholder="例: 美容室のInstagramリール動画を月4本作ってほしい"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button
          type="button"
          onClick={generate}
          disabled={loading || !idea.trim()}
          className="btn-primary w-full"
        >
          {loading ? "生成中..." : "AIで案件を下書き"}
        </button>
      </div>
    </details>
  );
}
