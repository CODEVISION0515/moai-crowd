// 通知ヘルパー: ユーザーの設定に応じたマルチチャンネル通知
import { createAdminClient } from "@/lib/supabase/server";
import { sendMail, notificationTemplate } from "@/lib/mail";
import { linePush } from "@/lib/line";
import type { NotificationKind } from "@/types/database";

interface NotifyOptions {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  link?: string | null;
}

/**
 * ユーザーの通知設定を確認し、有効なチャンネルに通知を送信する。
 * アプリ内通知はDBトリガーで自動作成されるため、ここではメールとLINEを処理。
 */
export async function notifyUser(options: NotifyOptions) {
  const { userId, kind, title, body, link } = options;
  const admin = createAdminClient();

  // 通知設定を取得（設定がない場合はデフォルト: email=true, line=false）
  const { data: pref } = await admin
    .from("notification_preferences")
    .select("channel_email, channel_line")
    .eq("user_id", userId)
    .eq("kind", kind)
    .maybeSingle();

  const emailEnabled = pref?.channel_email ?? true;
  const lineEnabled = pref?.channel_line ?? false;

  // ユーザー情報取得
  const { data: profile } = await admin
    .from("profiles")
    .select("line_user_id, notify_email, notify_line")
    .eq("id", userId)
    .single();

  if (!profile) return;

  // メール通知
  if (emailEnabled && profile.notify_email) {
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email;
    if (email) {
      const html = notificationTemplate(title, body ?? null, link ?? null);
      await sendMail(email, `[MOAI Crowd] ${title}`, html).catch(() => {});
    }
  }

  // LINE通知
  if (lineEnabled && profile.notify_line && profile.line_user_id) {
    const text = body ? `${title}\n${body}` : title;
    const fullLink = link ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${link}` : undefined;
    await linePush(profile.line_user_id, text, fullLink).catch(() => {});
  }
}
