import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function createInvoice(formData: FormData) {
  "use server";
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const recipientHandle = String(formData.get("recipient_handle") || "");
  const { data: recipient } = await sb.from("profiles").select("id").eq("handle", recipientHandle).single();
  if (!recipient) throw new Error("宛先ユーザーが見つかりません");

  const subject = String(formData.get("subject") || "");
  const amount = Number(formData.get("amount") || 0);
  const taxRate = Number(formData.get("tax_rate") || 10) / 100;
  const dueDate = String(formData.get("due_date") || "") || null;
  const notes = String(formData.get("notes") || "") || null;

  const subtotal = amount;
  const tax = Math.floor(subtotal * taxRate);
  const total = subtotal + tax;

  const { data: inv, error } = await sb.from("invoices").insert({
    issuer_id: user.id,
    recipient_id: recipient.id,
    subject,
    subtotal_jpy: subtotal,
    tax_jpy: tax,
    total_jpy: total,
    due_date: dueDate,
    notes,
    status: "sent",
  }).select("id").single();
  if (error) throw error;

  await sb.from("invoice_items").insert({
    invoice_id: inv.id,
    description: subject,
    quantity: 1,
    unit_price_jpy: subtotal,
    subtotal_jpy: subtotal,
  });

  redirect(`/invoices/${inv.id}`);
}

export default function NewInvoicePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">請求書を発行</h1>
      <form action={createInvoice} className="card space-y-4">
        <div>
          <label className="label">宛先ユーザー (ハンドル) *</label>
          <input name="recipient_handle" required className="input" placeholder="user_xxx" />
        </div>
        <div>
          <label className="label">件名 *</label>
          <input name="subject" required className="input" placeholder="例: LP制作費用" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">金額 (税抜) *</label>
            <input name="amount" type="number" required min="0" className="input" />
          </div>
          <div>
            <label className="label">消費税率 (%)</label>
            <input name="tax_rate" type="number" defaultValue="10" className="input" />
          </div>
        </div>
        <div>
          <label className="label">支払期日</label>
          <input name="due_date" type="date" className="input" />
        </div>
        <div>
          <label className="label">備考</label>
          <textarea name="notes" rows={3} className="input" />
        </div>
        <button className="btn-primary w-full">発行する</button>
      </form>
    </div>
  );
}
