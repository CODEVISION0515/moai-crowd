"use server";

import { revalidatePath } from "next/cache";
import { formAction, statefulFormAction } from "@/lib/actions";
import {
  updateBasicSchema,
  updateSocialSchema,
  addPortfolioSchema,
  addWorkExpSchema,
  addEducationSchema,
  addCertificationSchema,
  deleteByIdSchema,
} from "@/lib/validations";

const PROFILE_EDIT_PATH = "/profile/edit";
const revalidateEdit = () => revalidatePath(PROFILE_EDIT_PATH);

export const updateBasic = statefulFormAction(updateBasicSchema, async ({ sb, user, data: d }) => {
  const { error } = await sb.from("profiles").update({
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
    github_username: d.github_username,
    moai_badge_display: d.moai_badge_display,
    region: d.region,
  }).eq("id", user.id);
  if (error) return { error: "保存に失敗しました。ハンドル名の重複などをご確認ください。" };
  revalidateEdit();
  return { success: "基本情報を保存しました" };
});

export const updateSocial = statefulFormAction(updateSocialSchema, async ({ sb, user, data: d }) => {
  const { error } = await sb.from("profiles").update({
    twitter_handle: d.twitter,
    instagram_handle: d.instagram,
    github_handle: d.github,
    linkedin_url: d.linkedin,
    behance_url: d.behance,
    youtube_url: d.youtube,
    tiktok_handle: d.tiktok,
    website: d.website,
  }).eq("id", user.id);
  if (error) return { error: "SNS情報の保存に失敗しました" };
  revalidateEdit();
  return { success: "SNS情報を保存しました" };
});

export const addPortfolio = formAction(addPortfolioSchema, async ({ sb, user, data: d }) => {
  await sb.from("portfolios").insert({
    user_id: user.id,
    title: d.title,
    description: d.description,
    image_url: d.image_url,
    external_url: d.external_url,
    tags: d.tags,
    client_name: d.client_name,
    completed_at: d.completed_at,
    is_school_work: d.is_school_work,
    cohort: d.cohort,
    school_project_name: d.school_project_name,
  });
  revalidateEdit();
  if (d.is_school_work) {
    revalidatePath("/school/gallery");
    if (d.cohort) revalidatePath(`/school/showcase/${d.cohort}`);
  }
});

export const deletePortfolio = formAction(deleteByIdSchema, async ({ sb, data }) => {
  await sb.from("portfolios").delete().eq("id", data.id);
  revalidateEdit();
});

export const addWorkExp = formAction(addWorkExpSchema, async ({ sb, user, data: d }) => {
  await sb.from("work_experiences").insert({
    user_id: user.id,
    company: d.company,
    title: d.title,
    description: d.description,
    start_date: d.start_date,
    end_date: d.end_date,
    is_current: d.is_current,
  });
  revalidateEdit();
});

export const deleteWorkExp = formAction(deleteByIdSchema, async ({ sb, data }) => {
  await sb.from("work_experiences").delete().eq("id", data.id);
  revalidateEdit();
});

export const addEducation = formAction(addEducationSchema, async ({ sb, user, data: d }) => {
  await sb.from("educations").insert({
    user_id: user.id,
    school: d.school,
    degree: d.degree,
    field: d.field,
    start_date: d.start_date,
    end_date: d.end_date,
  });
  revalidateEdit();
});

export const deleteEducation = formAction(deleteByIdSchema, async ({ sb, data }) => {
  await sb.from("educations").delete().eq("id", data.id);
  revalidateEdit();
});

export const addCertification = formAction(addCertificationSchema, async ({ sb, user, data: d }) => {
  await sb.from("certifications").insert({
    user_id: user.id,
    name: d.name,
    issuer: d.issuer,
    issued_date: d.issued_date,
    credential_url: d.credential_url,
  });
  revalidateEdit();
});

export const deleteCertification = formAction(deleteByIdSchema, async ({ sb, data }) => {
  await sb.from("certifications").delete().eq("id", data.id);
  revalidateEdit();
});
