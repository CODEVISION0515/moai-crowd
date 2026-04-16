"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formAction } from "@/lib/actions";
import { acceptProposalSchema } from "@/lib/validations";

export const acceptProposal = formAction(acceptProposalSchema, async ({ sb, user, data }) => {
  const { data: prop } = await sb.from("proposals").select("*").eq("id", data.proposal_id).single();
  if (!prop) return;

  const feePercent = Number(process.env.PLATFORM_FEE_PERCENT || 10);
  const fee = Math.floor((prop.proposed_amount_jpy * feePercent) / 100);
  const payout = prop.proposed_amount_jpy - fee;

  await sb.from("contracts").insert({
    job_id: prop.job_id,
    proposal_id: prop.id,
    client_id: user.id,
    worker_id: prop.worker_id,
    amount_jpy: prop.proposed_amount_jpy,
    platform_fee_jpy: fee,
    worker_payout_jpy: payout,
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
