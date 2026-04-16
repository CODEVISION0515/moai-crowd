"use server";

import { redirect } from "next/navigation";
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

export async function finishOnboarding() {
  redirect("/dashboard");
}
