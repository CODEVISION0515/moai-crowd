"use server";

import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  parseFormData,
  updateBasicSchema,
  updateSocialSchema,
  addPortfolioSchema,
  addWorkExpSchema,
  addEducationSchema,
  addCertificationSchema,
  deleteByIdSchema,
} from "@/lib/validations";

export async function updateBasic(formData: FormData) {
  const { sb, user } = await requireUser();
  const parsed = parseFormData(updateBasicSchema, formData);
  if (!parsed.success) return;
  const d = parsed.data;
  await sb.from("profiles").update({
    display_name: d.display_name,
    handle: d.handle,
    tagline: d.tagline,
    bio: d.bio,
    skills: d.skills,
    hourly_rate_jpy: d.hourly_rate,
    location: d.location,
    years_experience: d.years_experience,
    languages: d.languages,
    service_areas: d.service_areas,
    availability: d.availability,
    work_hours: d.work_hours,
  }).eq("id", user.id);
  revalidatePath("/profile/edit");
}

export async function updateSocial(formData: FormData) {
  const { sb, user } = await requireUser();
  const parsed = parseFormData(updateSocialSchema, formData);
  if (!parsed.success) return;
  const d = parsed.data;
  await sb.from("profiles").update({
    twitter_handle: d.twitter,
    instagram_handle: d.instagram,
    github_handle: d.github,
    linkedin_url: d.linkedin,
    behance_url: d.behance,
    youtube_url: d.youtube,
    tiktok_handle: d.tiktok,
    website: d.website,
  }).eq("id", user.id);
  revalidatePath("/profile/edit");
}

export async function addPortfolio(formData: FormData) {
  const { sb, user } = await requireUser();
  const parsed = parseFormData(addPortfolioSchema, formData);
  if (!parsed.success) return;
  const d = parsed.data;
  await sb.from("portfolios").insert({
    user_id: user.id,
    title: d.title,
    description: d.description,
    image_url: d.image_url,
    external_url: d.external_url,
    tags: d.tags,
    client_name: d.client_name,
    completed_at: d.completed_at,
  });
  revalidatePath("/profile/edit");
}

export async function deletePortfolio(formData: FormData) {
  const { sb } = await requireUser();
  const parsed = parseFormData(deleteByIdSchema, formData);
  if (!parsed.success) return;
  await sb.from("portfolios").delete().eq("id", parsed.data.id);
  revalidatePath("/profile/edit");
}

export async function addWorkExp(formData: FormData) {
  const { sb, user } = await requireUser();
  const parsed = parseFormData(addWorkExpSchema, formData);
  if (!parsed.success) return;
  const d = parsed.data;
  await sb.from("work_experiences").insert({
    user_id: user.id,
    company: d.company,
    title: d.title,
    description: d.description,
    start_date: d.start_date,
    end_date: d.end_date,
    is_current: d.is_current,
  });
  revalidatePath("/profile/edit");
}

export async function deleteWorkExp(formData: FormData) {
  const { sb } = await requireUser();
  const parsed = parseFormData(deleteByIdSchema, formData);
  if (!parsed.success) return;
  await sb.from("work_experiences").delete().eq("id", parsed.data.id);
  revalidatePath("/profile/edit");
}

export async function addEducation(formData: FormData) {
  const { sb, user } = await requireUser();
  const parsed = parseFormData(addEducationSchema, formData);
  if (!parsed.success) return;
  const d = parsed.data;
  await sb.from("educations").insert({
    user_id: user.id,
    school: d.school,
    degree: d.degree,
    field: d.field,
    start_date: d.start_date,
    end_date: d.end_date,
  });
  revalidatePath("/profile/edit");
}

export async function deleteEducation(formData: FormData) {
  const { sb } = await requireUser();
  const parsed = parseFormData(deleteByIdSchema, formData);
  if (!parsed.success) return;
  await sb.from("educations").delete().eq("id", parsed.data.id);
  revalidatePath("/profile/edit");
}

export async function addCertification(formData: FormData) {
  const { sb, user } = await requireUser();
  const parsed = parseFormData(addCertificationSchema, formData);
  if (!parsed.success) return;
  const d = parsed.data;
  await sb.from("certifications").insert({
    user_id: user.id,
    name: d.name,
    issuer: d.issuer,
    issued_date: d.issued_date,
    credential_url: d.credential_url,
  });
  revalidatePath("/profile/edit");
}

export async function deleteCertification(formData: FormData) {
  const { sb } = await requireUser();
  const parsed = parseFormData(deleteByIdSchema, formData);
  if (!parsed.success) return;
  await sb.from("certifications").delete().eq("id", parsed.data.id);
  revalidatePath("/profile/edit");
}
