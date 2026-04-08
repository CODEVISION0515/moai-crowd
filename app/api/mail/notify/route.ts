// Supabase DB Webhook: notifications INSERT → メール + LINE 送信
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendMail, notificationTemplate, APP_URL } from "@/lib/mail";
import { linePush } from "@/lib/line";

export async function POST(req: Request) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await req.json();
  if (payload.table !== "notifications" || payload.type !== "INSERT") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const n = payload.record;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("is_suspended, line_user_id, notify_email, notify_line")
    .eq("id", n.user_id).single();
  if (profile?.is_suspended) return NextResponse.json({ ok: true, suspended: true });

  const results: Record<string, any> = {};

  // メール送信
  if (profile?.notify_email !== false) {
    const { data: auth } = await admin.auth.admin.getUserById(n.user_id);
    const email = auth?.user?.email;
    if (email) {
      try {
        await sendMail(email, `[MOAI Crowd] ${n.title}`, notificationTemplate(n.title, n.body, n.link));
        results.email = "sent";
      } catch (e: any) { results.email = `error: ${e.message}`; }
    }
  }

  // LINE送信
  if (profile?.notify_line && profile?.line_user_id) {
    try {
      const link = n.link ? `${APP_URL}${n.link}` : undefined;
      const body = n.body ? `\n${n.body}` : "";
      await linePush(profile.line_user_id, `【MOAI Crowd】${n.title}${body}`, link);
      results.line = "sent";
    } catch (e: any) { results.line = `error: ${e.message}`; }
  }

  return NextResponse.json({ ok: true, ...results });
}
