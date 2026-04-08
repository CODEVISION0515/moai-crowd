// LINE Messaging API Webhook: 連携トークンでアカウントを紐付け
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { lineReply, verifyLineSignature } from "@/lib/line";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature");
  if (!verifyLineSignature(body, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  const payload = JSON.parse(body);
  const admin = createAdminClient();

  for (const event of payload.events ?? []) {
    // ユーザーが「MOAI123456」のような連携トークンを送信してきた場合
    if (event.type === "message" && event.message?.type === "text") {
      const text: string = event.message.text.trim();
      const lineUserId: string = event.source.userId;

      const { data: token } = await admin
        .from("line_link_tokens")
        .select("*")
        .eq("token", text)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (token) {
        await admin.from("profiles").update({
          line_user_id: lineUserId,
          notify_line: true,
        }).eq("id", token.user_id);
        await admin.from("line_link_tokens").update({ used_at: new Date().toISOString() }).eq("token", text);
        await lineReply(event.replyToken, "✅ MOAI Crowdと連携しました！\n通知をLINEでお届けします。");
      } else {
        await lineReply(event.replyToken,
          "MOAI Crowdと連携するには、プロフィール設定画面で発行した連携コードを送信してください。");
      }
    }
  }

  return NextResponse.json({ ok: true });
}
