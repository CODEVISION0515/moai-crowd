import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, category, budget_min_jpy, budget_max_jpy, proposal_count, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <>
      <section className="bg-gradient-to-br from-moai-primary to-teal-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            仲間と創る、<br className="md:hidden" />仕事のマッチング
          </h1>
          <p className="mt-6 text-lg text-white/85">
            MOAIコミュニティから生まれたクラウドソーシング。<br />
            頼みたい人と、力を貸したい人を、ゆんたくで繋ぐ。
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/jobs" className="btn bg-moai-accent text-white hover:opacity-90">
              案件を探す
            </Link>
            <Link href="/signup" className="btn bg-white text-moai-primary hover:bg-slate-100">
              無料で始める
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/70">
            コミュニティ参加は完全無料 / 成約時のみ手数料10%
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-bold">新着案件</h2>
          <Link href="/jobs" className="text-sm text-moai-primary hover:underline">すべて見る →</Link>
        </div>
        {jobs && jobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((j) => (
              <Link key={j.id} href={`/jobs/${j.id}`} className="card hover:shadow-md transition">
                <span className="badge">{j.category}</span>
                <h3 className="mt-2 font-semibold line-clamp-2">{j.title}</h3>
                <div className="mt-3 text-sm text-slate-600">
                  予算: ¥{j.budget_min_jpy?.toLocaleString() ?? "-"} 〜 ¥{j.budget_max_jpy?.toLocaleString() ?? "-"}
                </div>
                <div className="mt-1 text-xs text-slate-400">応募 {j.proposal_count}件</div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-10">まだ案件がありません。最初の1件を投稿しませんか？</p>
        )}
      </section>

      <section className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">MOAI Crowdの使い方</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "登録 (無料)", text: "メールアドレスで登録、プロフィールを整える" },
              { step: "2", title: "依頼 / 応募", text: "案件を投稿するか、気になる案件に応募" },
              { step: "3", title: "取引・評価", text: "エスクローで安心取引、完了後に相互評価" },
            ].map((s) => (
              <div key={s.step} className="card text-center">
                <div className="text-3xl font-bold text-moai-accent">{s.step}</div>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
