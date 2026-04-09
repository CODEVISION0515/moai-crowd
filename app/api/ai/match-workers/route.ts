// AIマッチング: 案件に対して最適な受注者候補を提案
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai";
import { consumeCredits } from "@/lib/credits";

export async function POST(req: Request) {
  const { jobId } = await req.json();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const credit = await consumeCredits(user.id, "match_workers", { jobId });
  if (!credit.ok) return NextResponse.json({ error: credit.error, required: credit.required }, { status: 402 });

  const { data: job } = await sb.from("jobs").select("*").eq("id", jobId).single();
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });

  // スキル重複する受注者を上位20件取得
  const { data: candidates } = await sb
    .from("profiles")
    .select("id, handle, display_name, bio, skills, rating_avg, rating_count, hourly_rate_jpy")
    .eq("is_worker", true)
    .eq("is_suspended", false)
    .overlaps("skills", job.skills?.length ? job.skills : ["_none_"])
    .order("rating_avg", { ascending: false })
    .limit(20);

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  const SYSTEM = `あなたはクラウドソーシングのマッチングAIです。案件に対して最適な受注者を上位5名選び、各人に「なぜ合うか」の一言コメントをつけてください。
出力はJSON配列のみ:
[{ "handle": "xxx", "reason": "..." }]`;

  const prompt = `# 案件
タイトル: ${job.title}
カテゴリ: ${job.category}
スキル: ${job.skills?.join(", ")}
予算: ${job.budget_min_jpy}〜${job.budget_max_jpy}円
説明: ${job.description?.slice(0, 400)}

# 候補者 (${candidates.length}名)
${candidates.map((c) => `- @${c.handle} ${c.display_name} [★${Number(c.rating_avg).toFixed(1)} (${c.rating_count})] スキル: ${c.skills?.join(", ")} ${c.bio?.slice(0, 100) ?? ""}`).join("\n")}`;

  try {
    const text = await generateText(SYSTEM, prompt, 1024);
    const match = text.match(/\[[\s\S]*\]/);
    const picks = match ? JSON.parse(match[0]) : [];
    const byHandle = new Map(candidates.map((c) => [c.handle, c]));
    const matches = picks
      .map((p: any) => ({ ...byHandle.get(p.handle), reason: p.reason }))
      .filter((m: any) => m.id);
    return NextResponse.json({ matches });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
