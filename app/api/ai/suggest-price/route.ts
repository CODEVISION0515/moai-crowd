import { createAiRouteHandler } from "@/lib/ai-route";

const SYSTEM = `日本のクラウドソーシング相場に詳しいAIです。案件内容から妥当な予算範囲を提案してください。
出力JSONのみ:
{
  "min_jpy": 最低予算,
  "max_jpy": 最高予算,
  "reasoning": "根拠の説明（200文字以内）",
  "tier": "low|standard|high" — 相場感
}`;

export const POST = createAiRouteHandler({
  featureSlug: "suggest_price",
  parseJson: true,
  async buildPrompt(req, sb) {
    const { title, description, category, skills } = await req.json();

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
${similar?.map((s) => `- ${s.title}: ¥${s.budget_min_jpy}-${s.budget_max_jpy}`).join("\n") ?? "データなし"}

上記を踏まえて、適正な予算範囲を提案してください。`;

    return { system: SYSTEM, user: prompt, maxTokens: 600 };
  },
});
