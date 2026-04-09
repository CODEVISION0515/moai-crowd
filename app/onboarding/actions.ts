"use server";

import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { parseFormData, onboardingStep1Schema, onboardingStep2Schema } from "@/lib/validations";

export async function saveStep1(formData: FormData) {
  const { sb, user } = await requireUser();
  const parsed = parseFormData(onboardingStep1Schema, formData);
  if (!parsed.success) return;
  const d = parsed.data;
  await sb.from("profiles").update({
    display_name: d.display_name,
    handle: d.handle.toLowerCase().replace(/[^a-z0-9_]/g, ""),
    tagline: d.tagline,
  }).eq("id", user.id);
  redirect("/onboarding?step=2");
}

export async function saveStep2(formData: FormData) {
  const { sb, user } = await requireUser();
  const parsed = parseFormData(onboardingStep2Schema, formData);
  if (!parsed.success) return;
  const d = parsed.data;
  await sb.from("profiles").update({
    skills: d.skills,
    bio: d.bio,
    is_worker: d.role !== "client_only",
    is_client: d.role !== "worker_only",
  }).eq("id", user.id);
  redirect("/onboarding?step=3");
}

export async function finishOnboarding() {
  redirect("/dashboard");
}
