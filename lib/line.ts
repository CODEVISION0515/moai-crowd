// LINE Messaging API ヘルパー
const LINE_API = "https://api.line.me/v2/bot";

export async function linePush(userId: string, text: string, link?: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.warn("[line] LINE_CHANNEL_ACCESS_TOKEN未設定");
    return;
  }
  const messages: any[] = [{ type: "text", text }];
  if (link) {
    messages[0].text = `${text}\n\n${link}`;
  }
  const res = await fetch(`${LINE_API}/message/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: userId, messages }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE push failed: ${res.status} ${body}`);
  }
}

export async function lineReply(replyToken: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;
  await fetch(`${LINE_API}/message/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
}

export function verifyLineSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const crypto = require("crypto");
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return false;
  const hash = crypto.createHmac("sha256", secret).update(body).digest("base64");
  return hash === signature;
}
