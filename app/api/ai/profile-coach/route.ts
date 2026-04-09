import { createAiRouteHandler } from "@/lib/ai-route";

const SYSTEM = `あなたはクラウドソーシングのプロフィール最適化コーチです。
受注者のプロフィール情報を分析し、受注率を上げるための具体的なアドバイスをします。

出力JSON:
{
  "score": 0-100の総合スコア,
  "strengths": ["強み（最大3つ、具体的に）"],
  "improvements": ["改善点（最大4つ、具体的に何を書けば良いか）"],
  "next_actions": ["今すぐできるアクション（最大3つ）"]
}`;

export const POST = createAiRouteHandler({
  featureSlug: "profile_coach",
  parseJson: true,
  async buildPrompt(_req, sb, user) {
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
${workExps?.map((w) => `- ${w.title} @ ${w.company}`).join("\n") ?? "なし"}

# 資格 (${certs?.length ?? 0}件)
${certs?.map((c) => `- ${c.name}`).join("\n") ?? "なし"}

このプロフィールを分析してアドバイスしてください。日本語で。`;

    return { system: SYSTEM, user: prompt, maxTokens: 1500 };
  },
});
