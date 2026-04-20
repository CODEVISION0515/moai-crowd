"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formAction } from "@/lib/actions";
import { acceptProposalSchema } from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/server";
import { calculateFees, resolveWorkerRole } from "@/lib/fees";

export const acceptProposal = formAction(acceptProposalSchema, async ({ sb, user, data }) => {
  const { data: prop } = await sb
    .from("proposals")
    .select("*, workers:worker_id(crowd_role)")
    .eq("id", data.proposal_id)
    .single();
  if (!prop) return;

  // MOAIロールに応じた料率で手数料を算出（fee_rulesテーブル参照）
  const admin = createAdminClient();
  const workerRole = resolveWorkerRole((prop as any).workers?.crowd_role);
  const fees = await calculateFees(admin, prop.proposed_amount_jpy, workerRole);

  await sb.from("contracts").insert({
    job_id: prop.job_id,
    proposal_id: prop.id,
    client_id: user.id,
    worker_id: prop.worker_id,
    amount_jpy: prop.proposed_amount_jpy,
    platform_fee_jpy: fees.platformRevenue,
    worker_payout_jpy: fees.workerPayout,
    status: "funded",
  });
  await sb.from("proposals").update({ status: "accepted" }).eq("id", prop.id);
  await sb.from("jobs").update({ status: "in_progress" }).eq("id", prop.job_id);

  await sb.from("threads").upsert({
    job_id: prop.job_id,
    client_id: user.id,
    worker_id: prop.worker_id,
  }, { onConflict: "job_id,client_id,worker_id" });

  revalidatePath(`/jobs/${prop.job_id}`);
  redirect("/dashboard");
});
