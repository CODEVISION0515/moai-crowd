"use server";

import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { parseFormData, onboardingStep1Schema, onboardingStep2Schema } from "@/lib/validations";

export type ActionResult = { error?: string } | void;

export async function saveStep1(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { sb, user } = await requireUser();
  const parsed = parseFormData(onboardingStep1Schema, formData);
  if (!parsed.success) return { error: parsed.error };

  const d = parsed.data;
  const handle = d.handle.toLowerCase().replace(/[^a-z0-9_]/g, "");

  // ハンドル重複チェック
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
}

export async function saveStep2(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { sb, user } = await requireUser();
  const parsed = parseFormData(onboardingStep2Schema, formData);
  if (!parsed.success) return { error: parsed.error };

  const d = parsed.data;
  const { error } = await sb.from("profiles").update({
    skills: d.skills,
    bio: d.bio,
    is_worker: d.role !== "client_only",
    is_client: d.role !== "worker_only",
  }).eq("id", user.id);
  if (error) return { error: error.message };

  redirect("/onboarding?step=3");
}

export async function finishOnboarding() {
  redirect("/dashboard");
}
