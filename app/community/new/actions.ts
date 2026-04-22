"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { statefulFormAction } from "@/lib/actions";
import { createPostSchema } from "@/lib/validations";

export const createPost = statefulFormAction(createPostSchema, async ({ sb, user, data: d }) => {
  // ピン留めは講師・CM・管理者のみ
  let canPin = false;
  if (d.is_pinned) {
    const { data: p } = await sb
      .from("profiles")
      .select("crowd_role, role")
      .eq("id", user.id)
      .maybeSingle();
    canPin =
      ["lecturer", "community_manager"].includes(p?.crowd_role ?? "") ||
      ["admin", "moderator"].includes(p?.role ?? "");
  }

  const { data, error } = await sb.from("posts").insert({
    author_id: user.id,
    kind: d.kind,
    title: d.title,
    body: d.body,
    tags: d.tags,
    visibility: d.visibility,
    cohort_id: d.cohort_id,
    week_number: d.week_number,
    is_pinned: canPin,
  }).select("id").single();
  if (error) return { error: "投稿に失敗しました" };

  const { count } = await sb.from("posts").select("*", { count: "exact", head: true }).eq("author_id", user.id);
  if (count === 1) await sb.rpc("award_badge", { p_user_id: user.id, p_slug: "first_post" });
  await sb.rpc("award_xp", { p_user_id: user.id, p_reason: "post_created", p_amount: 10, p_meta: null });

  revalidatePath("/community");
  if (d.cohort_id) revalidatePath(`/school/cohort/${d.cohort_id}`);
  redirect(`/community/${data.id}`);
});
