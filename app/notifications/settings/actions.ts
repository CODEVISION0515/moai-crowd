"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { statefulFormAction } from "@/lib/actions";
import type { NotificationKind } from "@/types/database";

const COMMUNITY_KINDS: NotificationKind[] = [
  "post_commented", "post_liked", "comment_replied", "new_follower",
  "mentioned_in_comment", "mentioned_in_post", "post_answer_accepted",
];

const ALL_KINDS: NotificationKind[] = [
  "proposal_received", "proposal_accepted", "proposal_rejected",
  "deliverable_submitted", "deliverable_approved", "revision_requested",
  "message_received", "contract_funded", "review_received",
  ...COMMUNITY_KINDS,
  "event_upcoming",
];

// ── 全体設定 ───────────────────────────────────

const timeStr = z.string().regex(/^\d{2}:\d{2}$/, "HH:MM形式で入力してください");

const globalPrefsSchema = z.object({
  master_enabled: z.union([z.literal("on"), z.string(), z.undefined()]).transform((v) => v === "on"),
  email_enabled: z.union([z.literal("on"), z.string(), z.undefined()]).transform((v) => v === "on"),
  line_enabled: z.union([z.literal("on"), z.string(), z.undefined()]).transform((v) => v === "on"),
  quiet_hours_enabled: z.union([z.literal("on"), z.string(), z.undefined()]).transform((v) => v === "on"),
  quiet_hours_start: timeStr,
  quiet_hours_end: timeStr,
  digest_frequency: z.enum(["immediate", "daily_digest", "weekly_digest", "off"]),
});

export const saveGlobalPrefs = statefulFormAction(globalPrefsSchema, async ({ sb, user, data: d }) => {
  const { error } = await sb.from("notification_global_prefs").upsert({
    user_id: user.id,
    master_enabled: d.master_enabled,
    email_enabled: d.email_enabled,
    line_enabled: d.line_enabled,
    quiet_hours_enabled: d.quiet_hours_enabled,
    quiet_hours_start: `${d.quiet_hours_start}:00`,
    quiet_hours_end: `${d.quiet_hours_end}:00`,
    digest_frequency: d.digest_frequency,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) return { error: `保存失敗: ${error.message}` };
  revalidatePath("/notifications/settings");
  return { success: "全体設定を保存しました" };
});

// ── 種別ごと設定 ───────────────────────────────

const perKindSchema = z.record(z.string(), z.string().optional()).optional();

export const savePerKindPrefs = statefulFormAction(
  perKindSchema as z.ZodType<Record<string, string | undefined> | undefined, z.ZodTypeDef, unknown>,
  async ({ sb, user, data: form }) => {
    const f = form ?? {};
    const rows = ALL_KINDS.map((kind) => ({
      user_id: user.id,
      kind,
      channel_inapp: f[`${kind}_inapp`] === "on",
      channel_email: f[`${kind}_email`] === "on",
      channel_line: f[`${kind}_line`] === "on",
    }));
    const { error } = await sb
      .from("notification_preferences")
      .upsert(rows, { onConflict: "user_id,kind" });
    if (error) return { error: `保存失敗: ${error.message}` };
    revalidatePath("/notifications/settings");
    return { success: "種別設定を保存しました" };
  },
);
