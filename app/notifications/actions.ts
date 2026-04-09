"use server";

import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markAllRead() {
  const { sb, user } = await requireUser();
  await sb.from("notifications").update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id).is("read_at", null);
  revalidatePath("/notifications");
}
