import { createAiRouteHandler } from "@/lib/ai-route";

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

export const POST = createAiRouteHandler({
  featureSlug: "review_deliverable",
  parseJson: true,
  async buildPrompt(req, sb, user) {
    const { deliverableId } = await req.json();
    if (!deliverableId) throw new Error("deliverableId required");

    const { data: deliverable } = await sb.from("deliverables")
      .select("*, contracts(job_id, client_id, jobs(title, description, skills))")
      .eq("id", deliverableId)
      .single();
    if (!deliverable) throw new Error("not found");

    const contract = deliverable.contracts as Record<string, unknown> | null;
    if (contract?.client_id !== user.id) throw new Error("forbidden");

    const job = contract?.jobs as Record<string, unknown> | null;
    const prompt = `# 案件
タイトル: ${job?.title}
要件:
${job?.description}

# 成果物
受注者のコメント:
${deliverable.message}

添付ファイル数: ${deliverable.file_urls?.length ?? 0}

レビューしてください。`;

    return { system: SYSTEM, user: prompt, maxTokens: 1000 };
  },
});
