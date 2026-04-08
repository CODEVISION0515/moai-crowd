// AI案件下書き: ざっくりしたアイデアから案件タイトル・説明・カテゴリ・スキルを生成
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai";

const SYSTEM = `あなたは日本のクラウドソーシング「MOAI Crowd」の案件作成アシスタントです。
発注者が入力した曖昧なアイデアから、受注者が応募しやすい案件を作成します。

## 出力ルール
以下のJSON形式で、説明文なしで返してください:
{
  "title": "60文字以内・具体的",
  "description": "背景・目的・作業内容・納品物・注意事項を含む、Markdown可、500〜1200文字",
  "category": "web/design/writing/video/ai/marketing/translation/dev/other のいずれか",
  "skills": ["希望スキル", "最大6つ"],
  "budget_min_jpy": 最低予算の概算 (数値),
  "budget_max_jpy": 最高予算の概算 (数値)
}

曖昧な情報は業界相場で妥当な範囲を補完してください。`;

export async function POST(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { idea } = await req.json();
  if (!idea || typeof idea !== "string") {
    return NextResponse.json({ error: "idea required" }, { status: 400 });
  }

  try {
    const text = await generateText(SYSTEM, `発注アイデア:\n${idea}`, 2048);
    const match = text.match(/\{[\s\S]*\}/);
    const json = match ? JSON.parse(match[0]) : null;
    if (!json) throw new Error("JSON parse failed");
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
