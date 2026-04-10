// LLM プロバイダ抽象化層
// 環境変数 LLM_PROVIDER で切り替え: "gemini" (default) | "anthropic" | "openrouter"

type Provider = "gemini" | "anthropic" | "openrouter";
const PROVIDER = (process.env.LLM_PROVIDER || "openrouter") as Provider;

// Gemini ==================================================
async function callGemini(system: string, user: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY未設定");
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return text;
}

// Anthropic ===============================================
async function callAnthropic(system: string, user: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY未設定");
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${await res.text()}`);
  const data = await res.json();
  const block = data.content?.[0];
  return block?.type === "text" ? block.text : "";
}

// OpenRouter (無料モデル・自動フォールバック) ================
const FREE_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
  "qwen/qwen3-coder:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "google/gemma-3-4b-it:free",
];

async function callOpenRouterWithModel(
  apiKey: string, model: string, system: string, user: string, maxTokens: number,
): Promise<{ ok: boolean; text: string; error?: string }> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://moai-crowd.vercel.app",
        "X-Title": "MOAI Crowd",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, text: "", error: body };
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return { ok: false, text: "", error: "empty response" };
    return { ok: true, text };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return { ok: false, text: "", error: msg };
  }
}

async function callOpenRouter(system: string, user: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY未設定");

  const primary = process.env.OPENROUTER_MODEL || FREE_MODELS[0];
  const models = [primary, ...FREE_MODELS.filter((m) => m !== primary)];

  for (const model of models) {
    const result = await callOpenRouterWithModel(apiKey, model, system, user, maxTokens);
    if (result.ok) {
      return result.text;
    }
    console.warn(`[ai] ${model} failed, trying next...`);
  }
  throw new Error("全ての無料モデルがレート制限中です。しばらく待ってから再試行してください。");
}

// 統一インターフェース =====================================
export async function generateText(system: string, user: string, maxTokens = 1024): Promise<string> {
  switch (PROVIDER) {
    case "gemini": return await callGemini(system, user, maxTokens);
    case "anthropic": return await callAnthropic(system, user, maxTokens);
    case "openrouter": return await callOpenRouter(system, user, maxTokens);
    default: return await callOpenRouter(system, user, maxTokens);
  }
}

// 現プロバイダを返す(ログ・管理画面用)
export function currentProvider(): Provider { return PROVIDER; }
