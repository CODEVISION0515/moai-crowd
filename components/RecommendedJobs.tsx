"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function RecommendedJobs() {
  const [matches, setMatches] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/recommend-jobs")
      .then((r) => r.json())
      .then((d) => { setMatches(d.matches ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="card text-sm text-slate-500">AIがあなたにぴったりの案件を探しています...</div>;
  if (!matches || matches.length === 0) return null;

  return (
    <div className="card bg-gradient-to-br from-moai-primary/5 to-moai-accent/5">
      <h2 className="font-semibold">✨ AIおすすめ案件</h2>
      <p className="text-xs text-slate-500 mt-1">あなたのスキルとプロフィールからピックアップ</p>
      <div className="mt-3 space-y-2">
        {matches.map((m) => (
          <Link key={m.id} href={`/jobs/${m.id}`} className="block bg-white rounded-lg p-3 hover:shadow-md transition">
            <div className="font-semibold text-sm">{m.title}</div>
            <div className="text-xs text-slate-500 mt-1">¥{m.budget_min_jpy?.toLocaleString()}〜¥{m.budget_max_jpy?.toLocaleString()}</div>
            {m.reason && <div className="mt-1 text-xs text-moai-primary">💡 {m.reason}</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}
