"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { statefulFormAction } from "@/lib/actions";
import { createJobSchema } from "@/lib/validations";

export const createJob = statefulFormAction(createJobSchema, async ({ sb, user, data: d }) => {
  // assignee 指定があればハンドルからユーザーIDに解決し、通知
  let assigneeId: string | null = null;
  if (d.assignee_handle) {
    const { data: p } = await sb
      .from("profiles")
      .select("id")
      .eq("handle", d.assignee_handle)
      .maybeSingle();
    if (!p) {
      return { error: `指名した @${d.assignee_handle} が見つかりません` };
    }
    assigneeId = p.id;
  }

  const { data, error } = await sb.from("jobs").insert({
    client_id: user.id,
    title: d.title,
    description: d.description,
    category: d.category,
    skills: d.skills,
    budget_min_jpy: d.budget_min,
    budget_max_jpy: d.budget_max,
    budget_type: d.budget_type,
    deadline: d.deadline,
    alumni_only: d.alumni_only,
    mentor_required: d.mentor_required,
    status: "open" as const,
  }).select("id").single();

  if (error) return { error: "案件の投稿に失敗しました。時間をおいて再度お試しください。" };

  // 指名があれば対象ユーザーに通知
  if (assigneeId && data?.id) {
    await sb.from("notifications").insert({
      user_id: assigneeId,
      kind: "proposal_received",
      title: "💼 あなた宛の案件が届きました",
      body: `「${d.title}」への応募ページを確認してください`,
      link: `/jobs/${data.id}`,
    });
  }

  revalidatePath("/jobs");
  redirect(`/jobs/${data.id}`);
});
