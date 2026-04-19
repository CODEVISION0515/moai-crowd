"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { statefulFormAction } from "@/lib/actions";
import { createJobSchema } from "@/lib/validations";

export const createJob = statefulFormAction(createJobSchema, async ({ sb, user, data: d }) => {
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
    status: "open" as const,
  }).select("id").single();

  if (error) return { error: "案件の投稿に失敗しました。時間をおいて再度お試しください。" };
  revalidatePath("/jobs");
  redirect(`/jobs/${data.id}`);
});
