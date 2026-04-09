// LLM プロバイダ抽象化層
// 環境変数 LLM_PROVIDER で切り替え: "gemini" (default) | "anthropic" | "openrouter"

type Provider = "gemini" | "anthropic" | "openrouter";
const PROVIDER = (process.env.LLM_PROVIDER || "gemini") as Provider;

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

// OpenRouter (無料モデル) =================================
async function callOpenRouter(system: string, user: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY未設定");
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";

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
  if (!res.ok) throw new Error(`OpenRouter API error: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// 統一インターフェース =====================================
export async function generateText(system: string, user: string, maxTokens = 1024): Promise<string> {
  try {
    switch (PROVIDER) {
      case "gemini": return await callGemini(system, user, maxTokens);
      case "anthropic": return await callAnthropic(system, user, maxTokens);
      case "openrouter": return await callOpenRouter(system, user, maxTokens);
      default: return await callGemini(system, user, maxTokens);
    }
  } catch (e: any) {
    // Geminiがレート制限等で失敗したら OpenRouter にフォールバック
    if (PROVIDER === "gemini" && process.env.OPENROUTER_API_KEY) {
      console.warn("[ai] Gemini failed, falling back to OpenRouter:", e.message);
      return await callOpenRouter(system, user, maxTokens);
    }
    throw e;
  }
}

// 現プロバイダを返す(ログ・管理画面用)
export function currentProvider(): Provider { return PROVIDER; }
