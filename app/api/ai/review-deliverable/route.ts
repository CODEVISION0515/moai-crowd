// AI成果物レビュー: 発注者が承認前にAIに簡易チェックを依頼
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai";

const SYSTEM = `クラウドソーシング案件の成果物を第三者的にレビューするAIアシスタントです。
案件要件と成果物を比較し、以下の観点でフィードバックしてください:
1. 要件の充足度 (0-100%)
2. 良い点 (最大3つ)
3. 改善点・確認したい点 (最大3つ)
4. 承認推奨レベル (strong_yes / yes / revision_needed / reject)

出力JSON:
{
  "coverage_pct": 数値,
  "strengths": ["..."],
  "concerns": ["..."],
  "recommendation": "...",
  "summary": "総評（200文字以内）"
}`;

export async function POST(req: Request) {
  const { deliverableId } = await req.json();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: deliverable } = await sb.from("deliverables")
    .select("*, contracts(job_id, client_id, jobs(title, description, skills))")
    .eq("id", deliverableId)
    .single();
  if (!deliverable || deliverable.contracts?.client_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const job = (deliverable as any).contracts?.jobs;
  const prompt = `# 案件
タイトル: ${job?.title}
要件:
${job?.description}

# 成果物
受注者のコメント:
${deliverable.message}

添付ファイル数: ${deliverable.file_urls?.length ?? 0}

レビューしてください。`;

  try {
    const text = await generateText(SYSTEM, prompt, 1000);
    const match = text.match(/\{[\s\S]*\}/);
    const json = match ? JSON.parse(match[0]) : null;
    if (!json) throw new Error("JSON parse failed");
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
