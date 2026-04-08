import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  const { data: inv } = await sb.from("invoices")
    .select("*, issuer:issuer_id(handle, display_name, invoice_name, invoice_address, invoice_registration_number), recipient:recipient_id(handle, display_name, invoice_name, invoice_address)")
    .eq("id", id).single();
  if (!inv) notFound();

  const { data: items } = await sb.from("invoice_items").select("*").eq("invoice_id", id).order("sort_order");

  async function markPaid() {
    "use server";
    const sb2 = await createClient();
    await sb2.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    revalidatePath(`/invoices/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 print:max-w-full">
      <div className="mb-4 flex justify-between print:hidden">
        <Link href="/invoices" className="text-sm text-moai-primary hover:underline">← 一覧</Link>
        <div className="flex gap-2">
          {user?.id === inv.issuer_id && inv.status === "sent" && (
            <form action={markPaid}>
              <button className="btn-outline">入金済みに</button>
            </form>
          )}
          <button onClick={() => {}} className="btn-outline" data-print>印刷</button>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold">請求書</h1>
          <div className="text-right text-sm">
            <div className="font-mono">{inv.invoice_number}</div>
            <div className="text-slate-500">発行日: {inv.issued_at}</div>
            {inv.due_date && <div className="text-slate-500">支払期日: {inv.due_date}</div>}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500">請求先</div>
            <div className="font-semibold">{inv.recipient?.invoice_name ?? inv.recipient?.display_name} 様</div>
            {inv.recipient?.invoice_address && <div className="text-slate-600 text-xs mt-1 whitespace-pre-wrap">{inv.recipient.invoice_address}</div>}
          </div>
          <div>
            <div className="text-xs text-slate-500">請求元</div>
            <div className="font-semibold">{inv.issuer?.invoice_name ?? inv.issuer?.display_name}</div>
            {inv.issuer?.invoice_address && <div className="text-slate-600 text-xs mt-1 whitespace-pre-wrap">{inv.issuer.invoice_address}</div>}
            {inv.issuer?.invoice_registration_number && (
              <div className="text-slate-600 text-xs mt-1">登録番号: {inv.issuer.invoice_registration_number}</div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold">件名: {inv.subject}</div>
        </div>

        <table className="mt-4 w-full text-sm">
          <thead className="border-b-2 border-slate-800">
            <tr>
              <th className="text-left p-2">内容</th>
              <th className="text-right p-2">数量</th>
              <th className="text-right p-2">単価</th>
              <th className="text-right p-2">金額</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((it) => (
              <tr key={it.id} className="border-b border-slate-200">
                <td className="p-2">{it.description}</td>
                <td className="p-2 text-right">{it.quantity}</td>
                <td className="p-2 text-right">¥{it.unit_price_jpy.toLocaleString()}</td>
                <td className="p-2 text-right">¥{it.subtotal_jpy.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <table className="text-sm">
            <tbody>
              <tr><td className="p-1 text-right pr-4">小計</td><td className="p-1 text-right">¥{inv.subtotal_jpy.toLocaleString()}</td></tr>
              <tr><td className="p-1 text-right pr-4">消費税</td><td className="p-1 text-right">¥{inv.tax_jpy.toLocaleString()}</td></tr>
              {inv.withholding_tax_jpy > 0 && (
                <tr><td className="p-1 text-right pr-4">源泉徴収</td><td className="p-1 text-right text-red-600">- ¥{inv.withholding_tax_jpy.toLocaleString()}</td></tr>
              )}
              <tr className="border-t-2 border-slate-800 text-lg font-bold">
                <td className="p-2 text-right pr-4">合計</td>
                <td className="p-2 text-right">¥{inv.total_jpy.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {inv.notes && (
          <div className="mt-6 text-sm whitespace-pre-wrap text-slate-600">
            <div className="text-xs text-slate-500 mb-1">備考</div>
            {inv.notes}
          </div>
        )}

        <div className="mt-8 text-center">
          <span className={`badge ${inv.status === "paid" ? "bg-green-100 text-green-700" : ""}`}>
            {inv.status === "paid" ? "✓ 入金済" : "未入金"}
          </span>
        </div>
      </div>
    </div>
  );
}
