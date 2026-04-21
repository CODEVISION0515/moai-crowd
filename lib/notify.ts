// 通知ヘルパー: ユーザーの設定に応じたマルチチャンネル通知
// - notification_global_prefs (マスタートグル・クワイエットアワー・ダイジェスト)
// - notification_preferences (種別 × チャネル)
// - アプリ内通知はDBトリガーで自動作成されるため、ここではメール/LINEを処理
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
  /** 通知IDが既にある場合のダイジェストキュー用 */
  notificationId?: string;
}

type Sb = ReturnType<typeof createAdminClient>;

/**
 * クワイエットアワー中 or ダイジェスト配信を希望しているチャネルに対して、
 * 通知をダイジェストキューに積む（即時送信しない）。
 */
async function enqueueDigest(
  admin: Sb,
  userId: string,
  notificationId: string | undefined,
  channel: "email" | "line" | "push",
  digestFreq: string,
) {
  if (!notificationId) return;
  const next = new Date();
  if (digestFreq === "daily_digest") next.setDate(next.getDate() + 1);
  else if (digestFreq === "weekly_digest") next.setDate(next.getDate() + 7);
  else next.setHours(next.getHours() + 1); // クワイエットアワー明けに1時間後で仮
  await admin.from("notification_digest_queue").insert({
    user_id: userId,
    notification_id: notificationId,
    channel,
    scheduled_for: next.toISOString(),
  });
}

/**
 * ユーザーの通知設定を確認し、有効なチャンネルに通知を送信する。
 * 1) global prefs: master_enabled, digest_frequency, quiet_hours
 * 2) kind prefs: channel_email / channel_line ごと
 */
export async function notifyUser(options: NotifyOptions) {
  const { userId, kind, title, body, link, notificationId } = options;
  const admin = createAdminClient();

  // 1) グローバル設定
  const { data: gp } = await admin
    .from("notification_global_prefs")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (gp && !gp.master_enabled) return; // マスター無効
  if (gp?.digest_frequency === "off") return; // 完全停止

  // 2) 種別別設定
  const { data: pref } = await admin
    .from("notification_preferences")
    .select("channel_email, channel_line")
    .eq("user_id", userId)
    .eq("kind", kind)
    .maybeSingle();

  const emailEnabled = (gp?.email_enabled ?? true) && (pref?.channel_email ?? true);
  const lineEnabled = (gp?.line_enabled ?? false) && (pref?.channel_line ?? false);

  // 3) クワイエットアワー判定
  const { data: inQuiet } = await admin.rpc("is_in_quiet_hours", { p_user_id: userId });

  // 4) ユーザー情報取得
  const { data: profile } = await admin
    .from("profiles")
    .select("line_user_id, notify_email, notify_line")
    .eq("id", userId)
    .single();
  if (!profile) return;

  const shouldDigest = inQuiet || (gp?.digest_frequency && gp.digest_frequency !== "immediate");

  // ── メール ──────────────────────────
  if (emailEnabled && profile.notify_email) {
    if (shouldDigest) {
      await enqueueDigest(admin, userId, notificationId, "email", gp?.digest_frequency ?? "immediate");
    } else {
      const { data: authUser } = await admin.auth.admin.getUserById(userId);
      const email = authUser?.user?.email;
      if (email) {
        const html = notificationTemplate(title, body ?? null, link ?? null);
        await sendMail(email, `[MOAI Crowd] ${title}`, html).catch(() => {});
      }
    }
  }

  // ── LINE ────────────────────────────
  if (lineEnabled && profile.notify_line && profile.line_user_id) {
    if (shouldDigest) {
      await enqueueDigest(admin, userId, notificationId, "line", gp?.digest_frequency ?? "immediate");
    } else {
      const text = body ? `${title}\n${body}` : title;
      const fullLink = link ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${link}` : undefined;
      await linePush(profile.line_user_id, text, fullLink).catch(() => {});
    }
  }
}
