"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { parseFormData } from "@/lib/validations";
import type { ActionResult } from "@/lib/actions";

const createInterviewSchema = z.object({
  slug: z
    .string()
    .min(3, "スラッグは3文字以上")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "小文字英数字とハイフンのみ"),
  subject_handle: z
    .string()
    .optional()
    .transform((s) => (s?.trim() ? s.trim() : null)),
  cohort_id: z
    .union([z.string(), z.number(), z.literal(""), z.undefined()])
    .transform((v) => {
      if (v === undefined || v === "") return null;
      const n = Number(v);
      return Number.isInteger(n) && n > 0 ? n : null;
    }),
  title: z.string().min(1, "タイトルは必須です").max(200),
  summary: z.string().optional().transform((s) => (s?.trim() ? s.trim() : null)),
  body: z.string().min(10, "本文は10文字以上"),
  hero_image_url: z
    .string()
    .optional()
    .transform((s) => (s?.trim() ? s.trim() : null)),
  before_text: z.string().optional().transform((s) => (s?.trim() ? s.trim() : null)),
  after_text: z.string().optional().transform((s) => (s?.trim() ? s.trim() : null)),
  publish_now: z
    .union([z.literal("on"), z.string(), z.undefined()])
    .transform((v) => v === "on"),
});

export async function createInterview(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parseFormData(createInterviewSchema, formData);
  if (!parsed.success) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const admin = createAdminClient();

  // subject_handle をユーザーIDに解決
  let subjectUserId: string | null = null;
  if (parsed.data.subject_handle) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("handle", parsed.data.subject_handle)
      .maybeSingle();
    if (!data) {
      return { error: `ハンドル @${parsed.data.subject_handle} のユーザーが見つかりません`, fieldErrors: { subject_handle: "ユーザーが存在しません" } };
    }
    subjectUserId = data.id;
  }

  const { error } = await admin.from("interviews").insert({
    slug: parsed.data.slug,
    subject_user_id: subjectUserId,
    cohort_id: parsed.data.cohort_id,
    title: parsed.data.title,
    summary: parsed.data.summary,
    body: parsed.data.body,
    hero_image_url: parsed.data.hero_image_url,
    before_text: parsed.data.before_text,
    after_text: parsed.data.after_text,
    is_published: parsed.data.publish_now,
    published_at: parsed.data.publish_now ? new Date().toISOString() : null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "このスラッグは既に使われています", fieldErrors: { slug: "重複" } };
    }
    return { error: `作成失敗: ${error.message}` };
  }

  revalidatePath("/admin/interviews");
  revalidatePath("/school/interviews");
  revalidatePath("/school");
  return { success: parsed.data.publish_now ? "記事を公開しました" : "下書き保存しました" };
}

export async function togglePublishInterview(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const publish = formData.get("publish") === "true";

  const admin = createAdminClient();
  const { error } = await admin.from("interviews").update({
    is_published: publish,
    published_at: publish ? new Date().toISOString() : null,
  }).eq("id", id);
  if (error) return { error: `更新失敗: ${error.message}` };

  revalidatePath("/admin/interviews");
  revalidatePath("/school/interviews");
  revalidatePath("/school");
  return { success: publish ? "公開しました" : "非公開にしました" };
}
