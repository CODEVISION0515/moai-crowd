import { createAiRouteHandler } from "@/lib/ai-route";

const SYSTEM = `クラウドソーシングの応募文作成AIです。受注者目線で丁寧・誠実・具体的な応募文を書いてください。
- 冒頭で案件への関心と自己紹介
- 自分のスキル・実績が案件にどう活きるか
- 進め方の提案（ステップ）
- 納期・相談したい点
- 最後に挨拶
日本語、500〜800文字。Markdown不可。`;

export const POST = createAiRouteHandler({
  featureSlug: "draft_proposal",
  async buildPrompt(req, sb, user) {
    const { jobId } = await req.json();
    if (!jobId) throw new Error("jobId required");

    const [{ data: job }, { data: profile }] = await Promise.all([
      sb.from("jobs").select("*").eq("id", jobId).single(),
      sb.from("profiles").select("display_name, bio, skills").eq("id", user.id).single(),
    ]);
    if (!job || !profile) throw new Error("not found");

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

    return { system: SYSTEM, user: prompt, maxTokens: 1500 };
  },
});
