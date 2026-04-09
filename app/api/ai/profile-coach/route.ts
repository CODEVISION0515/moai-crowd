// AIプロフィールコーチ: プロフィールを分析して改善点を提案
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai";

const SYSTEM = `あなたはクラウドソーシングのプロフィール最適化コーチです。
受注者のプロフィール情報を分析し、受注率を上げるための具体的なアドバイスをします。

出力JSON:
{
  "score": 0-100の総合スコア,
  "strengths": ["強み（最大3つ、具体的に）"],
  "improvements": ["改善点（最大4つ、具体的に何を書けば良いか）"],
  "next_actions": ["今すぐできるアクション（最大3つ）"]
}`;

export async function POST() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [{ data: profile }, { data: portfolios }, { data: workExps }, { data: certs }] = await Promise.all([
    sb.from("profiles").select("*").eq("id", user.id).single(),
    sb.from("portfolios").select("title, description").eq("user_id", user.id),
    sb.from("work_experiences").select("company, title, description").eq("user_id", user.id),
    sb.from("certifications").select("name, issuer").eq("user_id", user.id),
  ]);

  const prompt = `# プロフィール
表示名: ${profile?.display_name}
キャッチコピー: ${profile?.tagline ?? "(未入力)"}
自己紹介: ${profile?.bio ?? "(未入力)"}
スキル: ${profile?.skills?.join(", ") ?? "(未入力)"}
経験年数: ${profile?.years_experience ?? "(未入力)"}
時給: ${profile?.hourly_rate_jpy ? `¥${profile.hourly_rate_jpy}` : "(未入力)"}
拠点: ${profile?.location ?? "(未入力)"}
言語: ${profile?.languages?.join(", ") ?? "(未入力)"}
稼働状態: ${profile?.availability}
完成度: ${profile?.profile_completion}%

# ポートフォリオ (${portfolios?.length ?? 0}件)
${portfolios?.map((p) => `- ${p.title}: ${p.description?.slice(0, 100)}`).join("\n") ?? "なし"}

# 職歴 (${workExps?.length ?? 0}件)
${workExps?.map((w: any) => `- ${w.title} @ ${w.company}`).join("\n") ?? "なし"}

# 資格 (${certs?.length ?? 0}件)
${certs?.map((c) => `- ${c.name}`).join("\n") ?? "なし"}

このプロフィールを分析してアドバイスしてください。日本語で。`;

  try {
    const text = await generateText(SYSTEM, prompt, 1500);
    const match = text.match(/\{[\s\S]*\}/);
    const json = match ? JSON.parse(match[0]) : null;
    if (!json) throw new Error("JSON parse failed");
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
