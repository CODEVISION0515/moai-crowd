"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { statefulFormAction, type ActionResult } from "@/lib/actions";
import { onboardingStep1Schema, onboardingStep2Schema } from "@/lib/validations";

export type { ActionResult };

export const saveStep1 = statefulFormAction(onboardingStep1Schema, async ({ sb, user, data: d }) => {
  const handle = d.handle.toLowerCase().replace(/[^a-z0-9_]/g, "");

  const { data: existing } = await sb
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .neq("id", user.id)
    .maybeSingle();
  if (existing) return { error: "このハンドルは既に使われています" };

  const { error } = await sb.from("profiles").update({
    display_name: d.display_name,
    handle,
    tagline: d.tagline,
  }).eq("id", user.id);
  if (error) return { error: error.message };

  redirect("/onboarding?step=2");
});

export const saveStep2 = statefulFormAction(onboardingStep2Schema, async ({ sb, user, data: d }) => {
  const { error } = await sb.from("profiles").update({
    skills: d.skills,
    bio: d.bio,
    is_worker: d.role !== "client_only",
    is_client: d.role !== "worker_only",
  }).eq("id", user.id);
  if (error) return { error: error.message };

  redirect("/onboarding?step=3");
});

/**
 * Step 2 をスキップ。intent (client/worker/both) に応じて is_worker/is_client を設定するだけ。
 * スキル/自己紹介はあとからプロフィール編集で入力可能。
 */
export async function skipStep2(formData: FormData) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const intent = String(formData.get("intent") ?? "");
  const role = intent === "client" ? "client_only" : intent === "worker" ? "worker_only" : "both";
  await sb.from("profiles").update({
    is_worker: role !== "client_only",
    is_client: role !== "worker_only",
  }).eq("id", user.id);
  redirect("/onboarding?step=3");
}

export async function finishOnboarding() {
  redirect("/dashboard");
}
