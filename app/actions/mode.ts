"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActiveMode = "worker" | "client";

export async function setActiveMode(mode: ActiveMode): Promise<{ ok: boolean; error?: string }> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await sb
    .from("profiles")
    .update({ active_mode: mode })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  // キャッシュ無効化: レイアウト・ダッシュボード・関連ページ
  revalidatePath("/", "layout");

  return { ok: true };
}
