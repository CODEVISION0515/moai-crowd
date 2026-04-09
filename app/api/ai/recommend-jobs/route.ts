import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai";
import { consumeCredits } from "@/lib/credits";

// recommend-jobs は結果に DB データを結合するため createAiRouteHandler ではなく直書き

export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const credit = await consumeCredits(user.id, "recommend_jobs");
  if (!credit.ok) return NextResponse.json({ error: credit.error, required: credit.required }, { status: 402 });

  const { data: profile } = await sb.from("profiles").select("skills, bio, display_name").eq("id", user.id).single();

  let query = sb.from("jobs")
    .select("id, title, description, category, skills, budget_min_jpy, budget_max_jpy")
    .eq("status", "open")
    .limit(30);
  if (profile?.skills?.length) {
    query = query.overlaps("skills", profile.skills);
  }
  const { data: jobs } = await query;
  if (!jobs || jobs.length === 0) return NextResponse.json({ matches: [] });

  const SYSTEM = `クラウドソーシングのAIマッチングです。受注者プロフィールに最もマッチする案件を上位5件選び、理由をつけてください。
出力JSON配列のみ:
[{ "id": "案件ID", "reason": "..." }]`;

  const prompt = `# 受注者
名前: ${profile?.display_name}
スキル: ${profile?.skills?.join(", ")}
自己紹介: ${profile?.bio?.slice(0, 300) ?? ""}

# 案件候補
${jobs.map((j) => `ID:${j.id} [${j.category}] ${j.title} | ${j.skills?.join(",")} | 予算¥${j.budget_min_jpy}-${j.budget_max_jpy}\n${j.description?.slice(0, 200)}`).join("\n\n")}`;

  try {
    const text = await generateText(SYSTEM, prompt, 1024);
    const match = text.match(/\[[\s\S]*\]/);
    const picks: { id: string; reason: string }[] = match ? JSON.parse(match[0]) : [];
    const byId = new Map(jobs.map((j) => [j.id, j]));
    const matches = picks.map((p) => ({ ...byId.get(p.id), reason: p.reason })).filter((m) => m.id);
    return NextResponse.json({ matches });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
