"use client";
import { useState } from "react";

export default function ProfileCoach() {
  const [advice, setAdvice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    const res = await fetch("/api/ai/profile-coach", { method: "POST" });
    const data = await res.json();
    setAdvice(data);
    setLoading(false);
  }

  return (
    <div className="card border-moai-accent/40 bg-amber-50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">✨ AIプロフィールコーチ</h3>
        <button onClick={ask} disabled={loading} className="btn-primary">
          {loading ? "分析中..." : "アドバイスをもらう"}
        </button>
      </div>
      <p className="text-xs text-slate-600 mt-1">受注率を上げるための改善ポイントをAIが教えてくれます</p>
      {advice && (
        <div className="mt-4 space-y-3 text-sm">
          {advice.score !== undefined && (
            <div>
              <div className="text-xs text-slate-500">プロフィール総合スコア</div>
              <div className="text-2xl font-bold text-moai-primary">{advice.score}/100</div>
            </div>
          )}
          {advice.strengths?.length > 0 && (
            <div>
              <div className="font-semibold text-green-700">✅ 強み</div>
              <ul className="mt-1 space-y-1">{advice.strengths.map((s: string, i: number) => <li key={i}>・{s}</li>)}</ul>
            </div>
          )}
          {advice.improvements?.length > 0 && (
            <div>
              <div className="font-semibold text-amber-700">💡 改善するともっと良い</div>
              <ul className="mt-1 space-y-1">{advice.improvements.map((s: string, i: number) => <li key={i}>・{s}</li>)}</ul>
            </div>
          )}
          {advice.next_actions?.length > 0 && (
            <div>
              <div className="font-semibold text-moai-primary">🎯 次にやること</div>
              <ul className="mt-1 space-y-1">{advice.next_actions.map((s: string, i: number) => <li key={i}>・{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
