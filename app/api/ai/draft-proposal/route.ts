// AI応募文下書き: 案件情報と自分のプロフィールから応募文を生成
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai";

const SYSTEM = `クラウドソーシングの応募文作成AIです。受注者目線で丁寧・誠実・具体的な応募文を書いてください。
- 冒頭で案件への関心と自己紹介
- 自分のスキル・実績が案件にどう活きるか
- 進め方の提案（ステップ）
- 納期・相談したい点
- 最後に挨拶
日本語、500〜800文字。Markdown不可。`;

export async function POST(req: Request) {
  const { jobId } = await req.json();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: job } = await sb.from("jobs").select("*").eq("id", jobId).single();
  const { data: profile } = await sb.from("profiles").select("display_name, bio, skills").eq("id", user.id).single();

  if (!job || !profile) return NextResponse.json({ error: "not found" }, { status: 404 });

  const prompt = `# 案件
タイトル: ${job.title}
カテゴリ: ${job.category}
求められるスキル: ${job.skills?.join(", ")}
予算: ¥${job.budget_min_jpy}-${job.budget_max_jpy}
説明:
${job.description}

# 私のプロフィール
名前: ${profile.display_name}
スキル: ${profile.skills?.join(", ")}
自己紹介: ${profile.bio ?? "(未記入)"}

上記を踏まえて応募文を書いてください。`;

  try {
    const text = await generateText(SYSTEM, prompt, 1500);
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
