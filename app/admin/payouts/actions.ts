"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function markPayoutComplete(formData: FormData): Promise<void> {
  await requireAdmin();
  const contractId = String(formData.get("contract_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!contractId) {
    redirect("/admin/payouts?err=missing_id");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("contracts")
    .update({
      paid_out_at: new Date().toISOString(),
      paid_out_note: note,
    })
    .eq("id", contractId)
    .eq("status", "released")
    .is("paid_out_at", null);

  if (error) {
    console.error("[markPayoutComplete] update error", error);
    redirect(`/admin/payouts?err=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/payouts");
  redirect("/admin/payouts?done=1");
}
