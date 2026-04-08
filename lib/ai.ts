import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
export const anthropic = apiKey ? new Anthropic({ apiKey }) : null;
export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

export async function generateText(system: string, user: string, maxTokens = 1024) {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY未設定");
  const res = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = res.content[0];
  return block.type === "text" ? block.text : "";
}
