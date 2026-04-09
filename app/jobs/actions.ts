"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleBookmark(jobId: string) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { data: existing } = await sb
    .from("bookmarks")
    .select("job_id")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();

  if (existing) {
    await sb.from("bookmarks").delete().eq("user_id", user.id).eq("job_id", jobId);
  } else {
    await sb.from("bookmarks").insert({ user_id: user.id, job_id: jobId });
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/bookmarks");
  return { bookmarked: !existing };
}
