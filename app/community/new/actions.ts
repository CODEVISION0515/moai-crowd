"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { statefulFormAction } from "@/lib/actions";
import { createPostSchema } from "@/lib/validations";

export const createPost = statefulFormAction(createPostSchema, async ({ sb, user, data: d }) => {
  const { data, error } = await sb.from("posts").insert({
    author_id: user.id,
    kind: d.kind,
    title: d.title,
    body: d.body,
    tags: d.tags,
  }).select("id").single();
  if (error) return { error: "投稿に失敗しました" };

  const { count } = await sb.from("posts").select("*", { count: "exact", head: true }).eq("author_id", user.id);
  if (count === 1) await sb.rpc("award_badge", { p_user_id: user.id, p_slug: "first_post" });
  await sb.rpc("award_xp", { p_user_id: user.id, p_reason: "post_created", p_amount: 10, p_meta: null });

  revalidatePath("/community");
  redirect(`/community/${data.id}`);
});
