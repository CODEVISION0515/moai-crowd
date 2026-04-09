// AI価格提案: 案件内容と過去の類似案件から相場を提案
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai";
import { consumeCredits } from "@/lib/credits";

const SYSTEM = `日本のクラウドソーシング相場に詳しいAIです。案件内容から妥当な予算範囲を提案してください。
出力JSONのみ:
{
  "min_jpy": 最低予算,
  "max_jpy": 最高予算,
  "reasoning": "根拠の説明（200文字以内）",
  "tier": "low|standard|high" — 相場感
}`;

export async function POST(req: Request) {
  const { title, description, category, skills } = await req.json();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const credit = await consumeCredits(user.id, "suggest_price");
  if (!credit.ok) return NextResponse.json({ error: credit.error, required: credit.required }, { status: 402 });

  // 類似案件の相場データ
  const { data: similar } = await sb.from("jobs")
    .select("title, budget_min_jpy, budget_max_jpy")
    .eq("category", category)
    .not("budget_min_jpy", "is", null)
    .limit(10);

  const prompt = `# 案件
タイトル: ${title}
カテゴリ: ${category}
スキル: ${skills}
説明: ${description?.slice(0, 500)}

# 類似案件の相場 (このプラットフォームの実データ)
${similar?.map((s: any) => `- ${s.title}: ¥${s.budget_min_jpy}-${s.budget_max_jpy}`).join("\n") ?? "データなし"}

上記を踏まえて、適正な予算範囲を提案してください。`;

  try {
    const text = await generateText(SYSTEM, prompt, 600);
    const match = text.match(/\{[\s\S]*\}/);
    const json = match ? JSON.parse(match[0]) : null;
    if (!json) throw new Error("JSON parse failed");
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
