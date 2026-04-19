"use server";

import { redirect } from "next/navigation";
import { statefulFormAction } from "@/lib/actions";
import { createInvoiceSchema } from "@/lib/validations";

export const createInvoice = statefulFormAction(createInvoiceSchema, async ({ sb, user, data: d }) => {
  const { data: recipient } = await sb
    .from("profiles")
    .select("id")
    .eq("handle", d.recipient_handle)
    .maybeSingle();
  if (!recipient) {
    return {
      error: "宛先ユーザーが見つかりません",
      fieldErrors: { recipient_handle: "このハンドルのユーザーは存在しません" },
    };
  }

  const subtotal = d.amount;
  const tax = Math.floor(subtotal * (d.tax_rate / 100));
  const total = subtotal + tax;

  const { data: inv, error } = await sb.from("invoices").insert({
    issuer_id: user.id,
    recipient_id: recipient.id,
    subject: d.subject,
    subtotal_jpy: subtotal,
    tax_jpy: tax,
    total_jpy: total,
    due_date: d.due_date,
    notes: d.notes,
    status: "sent",
  }).select("id").single();
  if (error) return { error: "請求書の発行に失敗しました" };

  await sb.from("invoice_items").insert({
    invoice_id: inv.id,
    description: d.subject,
    quantity: 1,
    unit_price_jpy: subtotal,
    subtotal_jpy: subtotal,
  });

  redirect(`/invoices/${inv.id}`);
});
